// pluscan — changelog fetching for the pre-install review card (no GitHub API).
// Copyright (C) 2026 quasicry
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

// 變更日誌抓取（零 GitHub API，Canary-Edge 語義適配）：
// release notes → releases/tag/<tag> 頁爬 body；changelog 檔案 → raw.githubusercontent HEAD。
// priority: release_notes | changelog_file，互為 fallback；都沒有返回 null（顯示「無 changelog」不阻塞）。
import { requestUrl } from "obsidian";
import type { ChangelogPriority } from "../settings";

export type { ChangelogPriority };

async function getText(url: string): Promise<string | null> {
	try {
		const r = await requestUrl({ url, throw: false });
		if (r.status < 200 || r.status >= 300) return null;
		const t = r.text;
		return t && t.trim() !== "" ? t.trim() : null;
	} catch {
		return null;
	}
}

/** 從 releases/tag/<tag> 頁面爬 release body（渲染後的 notes 在 .markdown-body 內，取純文本語義）。 */
async function fetchReleaseNotes(repo: string, tag: string): Promise<string | null> {
	const html = await getText("https://github.com/" + repo + "/releases/tag/" + encodeURIComponent(tag));
	if (!html) return null;
	// 只取第一個 markdown-body 區塊；正則避 lookbehind（iOS 16.4 以下禁令）
	const marker = html.indexOf("markdown-body");
	if (marker < 0) return null;
	// 從屬性所在標籤的結尾 '>' 之後開始（否則 class 屬性文本洩漏）
	const start = html.indexOf(">", marker) + 1;
	const end = html.indexOf("</article>", start);
	const seg = html.slice(start, end > 0 ? end : start + 20000);
	// GitHub 錯誤頁偵測：中間層污染／伺服器異常時頁面仍含 markdown-body，其「內文」是錯誤提示——
	// 不可當作 release notes 顯示（真實案例：錯誤頁「Uh oh! There was an error while loading」被渲染）。
	if (seg.indexOf("Uh oh!") >= 0 && seg.indexOf("error while loading") >= 0) return null;
	// 剝 HTML 標籤與壓縮空白，保留塊級換行語義
	const text = seg
		.replace(/<(h[1-6]|p|li|ul|ol|pre|blockquote|hr)[\s>]/gi, "\n\n<$1")
		.replace(/<[^>]+>/g, "")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
	return text !== "" ? text : null;
}

/** 從 raw.githubusercontent HEAD 抓 CHANGELOG.md（零 API，HEAD＝默認分支）。 */
async function fetchChangelogFile(repo: string): Promise<string | null> {
	const candidates = ["CHANGELOG.md", "Changelog.md", "changelog.md", "CHANGES.md"];
	for (const name of candidates) {
		const t = await getText("https://raw.githubusercontent.com/" + repo + "/HEAD/" + name);
		if (t) return t;
	}
	return null;
}

export interface FetchChangelogOptions {
	repo: string;
	/** release tag；null（如裸目錄 URL 來源）時無 release notes 可抓 */
	tag: string | null;
	priority: ChangelogPriority;
}

/** 依 priority 抓 changelog，互為 fallback；全缺返回 null。只抓 priority 首選，未命中才 fallback。 */
export async function fetchChangelog(opts: FetchChangelogOptions): Promise<string | null> {
	if (opts.priority === "changelog_file") {
		const file = await fetchChangelogFile(opts.repo);
		if (file) return file;
		return opts.tag ? await fetchReleaseNotes(opts.repo, opts.tag) : null;
	}
	const notes = opts.tag ? await fetchReleaseNotes(opts.repo, opts.tag) : null;
	if (notes) return notes;
	return await fetchChangelogFile(opts.repo);
}
