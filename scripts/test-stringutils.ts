// pluscan — stringUtils 單元測試（esbuild 打包後 node 直跑）。
// Copyright (C) 2026 quasicry
// SPDX-License-Identifier: AGPL-3.0-or-later
import { scrubRepositoryUrl, latestReleaseAssetUrl, taggedReleaseAssetUrl } from "../src/installer/stringUtils";

let pass = 0, fail = 0;
function eq(actual: unknown, expected: unknown, label: string): void {
	const a = JSON.stringify(actual), e = JSON.stringify(expected);
	if (a === e) { pass++; }
	else { fail++; console.log("FAIL", label, "got", a, "want", e); }
}

const cases: Array<[string, unknown]> = [
	["https://github.com/user/repo", { repo: "user/repo", tag: null }],
	["https://github.com/user/repo/", { repo: "user/repo", tag: null }],
	["https://github.com/user/repo/tree/master", { repo: "user/repo", tag: null }],
	["https://github.com/user/repo/tree/master/src", { repo: "user/repo", tag: null }],
	["https://github.com/user/repo/releases", { repo: "user/repo", tag: null }],
	["https://github.com/user/repo/releases/latest", { repo: "user/repo", tag: null }],
	["https://github.com/user/repo/releases/tag/v1.2.3", { repo: "user/repo", tag: "v1.2.3" }],
	["https://github.com/user/repo/releases/tag/1.0.0-beta.1#readme", { repo: "user/repo", tag: "1.0.0-beta.1" }],
	["https://github.com/user/repo.git", { repo: "user/repo", tag: null }],
	["git@github.com:user/repo.git", { repo: "user/repo", tag: null }],
	["git@github.com:user/repo", { repo: "user/repo", tag: null }],
	["ssh://git@github.com/user/repo.git", { repo: "user/repo", tag: null }],
	["https://raw.githubusercontent.com/user/repo/master/manifest.json", { repo: "user/repo", tag: null }],
	["https://api.github.com/repos/user/repo", { repo: "user/repo", tag: null }],
	["https://api.github.com/repos/user/repo/contents/dist", { repo: "user/repo", tag: null }],
	["user/repo", { repo: "user/repo", tag: null }],
	["user/repo.git", { repo: "user/repo", tag: null }],
	["user.name/repo.name", { repo: "user.name/repo.name", tag: null }],
	// 非法
	["", null],
	["https://gitlab.com/user/repo", null],
	["https://example.com", null],
	["justtext", null],
	["https://github.com/user", null],
];

for (const [input, expected] of cases) eq(scrubRepositoryUrl(input), expected, input);

eq(latestReleaseAssetUrl("user/repo", "plugin.zip"), "https://github.com/user/repo/releases/latest/download/plugin.zip", "latest asset");
eq(taggedReleaseAssetUrl("user/repo", "v1.0.0", "plugin.zip"), "https://github.com/user/repo/releases/download/v1.0.0/plugin.zip", "tagged asset");

console.log(`pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);
