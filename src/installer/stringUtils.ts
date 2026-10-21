// pluscan — install Obsidian plugins from local archives and URLs.
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

// stringUtils — GitHub URL 智能清洗（scrubRepositoryUrl）。
// 接受任意 GitHub 鏈接格式，歸一為 user/repo；正則全避 lookbehind（iOS 16.4 以下禁令）。

export interface ScrubResult {
	/** 歸一後的 user/repo（無 .git 後綴、無協議） */
	repo: string;
	/** release tag（僅當輸入含 /releases/tag/<tag> 時） */
	tag: string | null;
}

/**
 * 從任意 GitHub 鏈接提取 user/repo（與可選 release tag）。
 * 支持：
 *  - https://github.com/user/repo
 *  - https://github.com/user/repo/tree/branch（/tree/ 前段剥除）
 *  - https://github.com/user/repo/releases/tag/v1.2.3
 *  - https://github.com/user/repo/releases/latest
 *  - https://github.com/user/repo.git
 *  - git@github.com:user/repo(.git)
 *  - ssh://git@github.com/user/repo(.git)
 *  - https://raw.githubusercontent.com/user/repo/<branch>/...
 *  - https://api.github.com/repos/user/repo（/contents/... 等後段剥除）
 *  - user/repo 簡寫
 * 不支持（返回 null）：非 GitHub 來源、空輸入、殘缺格式。
 */
export function scrubRepositoryUrl(input: string): ScrubResult | null {
	let s = (input ?? "").trim();
	if (!s) return null;

	// 剝 hash 與 query
	s = s.replace(/#.*$/, "").replace(/\?.*$/, "");

	// api.github.com/repos/user/repo[/...]
	let m = s.match(/^https?:\/\/api\.github\.com\/repos\/([^/\s]+)\/([^/\s]+?)(?:\/.*)?$/i);
	if (m) return finish(m[1], m[2], null);

	// raw.githubusercontent.com/user/repo/<branch>[/...]
	m = s.match(/^https?:\/\/raw\.githubusercontent\.com\/([^/\s]+)\/([^/\s]+?)(?:\/.*)?$/i);
	if (m) return finish(m[1], m[2], null);

	// git@ / ssh://git@ 格式（SCP 語法冒號）
	m = s.match(/^(?:ssh:\/\/)?git@github\.com[:/]([^/\s]+)\/([^/\s]+?)$/i);
	if (m) return finish(m[1], m[2], null);

	// github.com/user/repo[/tree/<branch>|/releases[/tag/<tag>|/latest]|...]
	m = s.match(/^https?:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\/(.*))?$/i);
	if (m) {
		const rest = m[3] ?? "";
		const tm = rest.match(/^releases\/tag\/([^/\s]+)$/i);
		if (tm) return finish(m[1], m[2], tm[1]);
		// /releases/latest 或 /releases 或 /tree/... → repo 本體（tag 由 latest 直鏈解析）
		return finish(m[1], m[2], null);
	}

	// user/repo 簡寫（可帶 .git）
	m = s.match(/^([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
	if (m) return finish(m[1], m[2], null);

	return null;
}

function finish(user: string, repoRaw: string, tag: string | null): ScrubResult | null {
	let repo = repoRaw;
	if (repo.toLowerCase().endsWith(".git")) repo = repo.slice(0, -4);
	repo = repo.replace(/\/+$/, "");
	if (!user || !repo) return null;
	if (!/^[\w.-]+$/.test(user) || !/^[\w.-]+$/.test(repo)) return null;
	return { repo: user + "/" + repo, tag };
}

/** 組裝 latest release 資產直鏈（無需 GitHub API）。 */
export function latestReleaseAssetUrl(repo: string, asset: string): string {
	return "https://github.com/" + repo + "/releases/latest/download/" + asset;
}

/** 組裝具體 tag 的 release 資產直鏈（用戶貼 tag 鏈接時）。 */
export function taggedReleaseAssetUrl(repo: string, tag: string, asset: string): string {
	return "https://github.com/" + repo + "/releases/download/" + encodeURIComponent(tag) + "/" + asset;
}
