// pluscan — install Obsidian plugins from GitHub Releases (no GitHub API).
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

// GitHub Releases 安裝。零 API（Developer policies＋中國大陸可用性）：
// latest → releases/latest 頁 canonical link 解析 tag → expanded_assets 片段爬資產列表；
// 具體 tag（用戶貼 /releases/tag/<tag> 鏈接）直接用 tag 查 expanded_assets。
// 資產兩形態：歸檔（.zip/.tar.gz）→ fetchRemoteZip；裸三件套（main.js/manifest.json[/styles.css]）→ fetchRemoteDir 同構寫盤。
import { requestUrl } from "obsidian";
import { scrubRepositoryUrl } from "./stringUtils";
import { resolveRemoteUrl } from "./remote";

export type ReleaseChannel = "stable" | "beta";

/** 從 releases/latest 頁面 HTML 解析當前 tag（canonical link）。 */
function parseTagFromLatestHtml(html: string): string | null {
	const m = html.match(/rel="canonical"[^>]*href="[^"]*\/releases\/tag\/([^"?#/]+)/i)
		?? html.match(/href="[^"]*\/releases\/tag\/([^"?#/]+)"/i);
	return m ? decodeURIComponent(m[1]) : null;
}

/** 從 expanded_assets 片段爬資產路徑列表（形如 /user/repo/releases/download/<tag>/<file>）。 */
function parseAssetsFromHtml(html: string, repo: string, tag: string): string[] {
	const escapeRe = (v: string): string => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const re = new RegExp('href="(/' + escapeRe(repo) + '/releases/download/' + escapeRe(tag) + '/[^"#?]+)"', "gi");
	const out: string[] = [];
	let m: RegExpExecArray | null;
	while ((m = re.exec(html)) !== null) {
		if (!out.includes(m[1])) out.push(m[1]);
	}
	return out;
}

async function getText(url: string): Promise<{ status: number; text: string }> {
	const r = await requestUrl({ url, throw: false });
	return { status: r.status, text: r.text };
}

export interface ResolveReleaseResult {
	tag: string;
	/** 全部資產路徑（/user/repo/releases/download/<tag>/<file>） */
	assets: string[];
}

/** 解析 repo 的 release 資產列表。tag=null → latest（stable 語義：GitHub latest 不含 pre-release）。 */
export async function resolveReleaseAssets(repo: string, tag: string | null): Promise<{ ok: true; value: ResolveReleaseResult } | { ok: false; error: string }> {
	let resolvedTag = tag;
	if (!resolvedTag) {
		const latest = await getText("https://github.com/" + repo + "/releases/latest");
		if (latest.status < 200 || latest.status >= 300) return { ok: false, error: "releases/latest HTTP " + latest.status };
		resolvedTag = parseTagFromLatestHtml(latest.text);
		if (!resolvedTag) return { ok: false, error: "no-tag" };
	}
	const assetsPage = await getText("https://github.com/" + repo + "/releases/expanded_assets/" + encodeURIComponent(resolvedTag));
	if (assetsPage.status < 200 || assetsPage.status >= 300) return { ok: false, error: "expanded_assets HTTP " + assetsPage.status };
	const assets = parseAssetsFromHtml(assetsPage.text, repo, resolvedTag);
	if (assets.length === 0) return { ok: false, error: "no-assets" };
	return { ok: true, value: { tag: resolvedTag, assets } };
}

const ARCHIVE_RE = /\.(zip|tar\.gz|tgz|tar)$/i;

export interface ResolvedRelease {
	repo: string;
	tag: string;
	/** 待寫盤數據（fetch 完成但未寫盤——確認前不寫任何文件） */
	resolved: import("./remote").ResolvedRemote;
}

/**
 * 從 GitHub Releases 解析安裝數據（只 fetch 不寫盤）：scrub → tag/資產列表 → 抓取歸檔或裸三件套。
 * 寫盤由調用方在確認後調 commitRemote。
 */
export async function resolveGitHubRelease(input: string, channel: ReleaseChannel): Promise<{ ok: true; value: ResolvedRelease } | { ok: false; error: string }> {
	const scrubbed = scrubRepositoryUrl(input);
	if (!scrubbed) return { ok: false, error: "bad-url" };
	// 由用戶貼 /releases/tag/<tag> → 以該 tag 為準（優先於 channel）；channel 語義：stable/beta 都解析 latest；beta 的 pre-release 由用戶貼 /releases/tag/<tag> 鏈接指定
	void channel;
	const resolved = await resolveReleaseAssets(scrubbed.repo, scrubbed.tag);
	if (!resolved.ok) return { ok: false, error: resolved.error };
	const { tag: finalTag, assets } = resolved.value;

	// 1) 歸檔資產優先
	const archive = assets.find((a) => ARCHIVE_RE.test(a));
	if (archive) {
		const url = "https://github.com" + archive;
		const fetched = await resolveRemoteUrl(url);
		if (!fetched.ok) return fetched;
		return { ok: true, value: { repo: scrubbed.repo, tag: finalTag, resolved: fetched.value } };
	}

	// 2) 裸三件套資產：main.js ＋ manifest.json 必須同在
	const hasMain = assets.some((a) => a.toLowerCase().endsWith("/main.js"));
	const hasManifest = assets.some((a) => a.toLowerCase().endsWith("/manifest.json"));
	if (hasMain && hasManifest) {
		const base = "https://github.com/" + scrubbed.repo + "/releases/download/" + encodeURIComponent(finalTag) + "/";
		const fetched = await resolveRemoteUrl(base);
		if (!fetched.ok) return fetched;
		return { ok: true, value: { repo: scrubbed.repo, tag: finalTag, resolved: fetched.value } };
	}

	return { ok: false, error: "no-assets" };
}
