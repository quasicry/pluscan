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

// 遠程安裝來源。US-004。
// 模式 A：裸目錄 URL——GET manifest.json/main.js/styles.css 三件套，styles 可缺失。
// 模式 B：zip URL——下載二進位後復用 US-003 的 zip 管線（含路徑穿越防護）。
// 安全：強制 https（僅 localhost http 放行）；manifest id 白名單；
// minAppVersion 預檢；styles.css 僅 404/410 算缺失；新版缺 styles 主動刪舊檔；啟用失敗如實報錯。
import { App, requestUrl, normalizePath } from "obsidian";
import { parseManifest, type Manifest } from "../scanner/scanner";
import { parseZipManifest, looksLikeArchiveUrl } from "./zip";
import type { InstallOptions } from "./installer";
import { installFromZip } from "./installer";

/** zip/tar/tar.gz URL 判定：路徑末段為壓縮檔副檔名（允許尾隨斜線）。 */
export function looksLikeZipUrl(url: URL): boolean {
	// 1.14 遺留教訓：normalizeRootUrl 會補尾斜線，pathname 變 "/x.zip/"——中段副檔名需匹配（尾斜線可選）。
	return looksLikeArchiveUrl(url);
}

/** URL 清洗：剝 hash；粘目錄或 manifest.json 均可；query 保留。 */
export function normalizeRootUrl(input: string): URL | null {
	let root: URL;
	try {
		root = new URL(input.trim());
	} catch {
		return null;
	}
	const dev = root.protocol === "http:" && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(root.hostname);
	if (root.protocol !== "https:" && !dev) return null; // 插件代碼必須走 https
	root.hash = "";
	root.pathname = root.pathname.replace(/\/manifest\.json$/i, "").replace(/\/+$/, "") + "/";
	return root;
}

export interface RemoteFiles {
	manifest: Manifest;
	/** 三件套內容；styles.css 缺失時為 null */
	mainJs: Uint8Array;
	manifestText: string;
	stylesCss: string | null;
	/** 可選附加檔（目前 icon.svg）；404/410 時缺席 */
	iconSvg: Uint8Array | null;
}

/** 模式 A：從裸目錄 URL 抓三件套＋icon.svg（可選；main.js/styles.css 以二進位取，避免文本編碼問題）。 */
export async function fetchRemoteDir(root: URL): Promise<{ ok: true; files: RemoteFiles } | { ok: false; error: string }> {
	const get = async (name: string): Promise<{ status: number; bytes: Uint8Array }> => {
		const u = new URL(root);
		u.pathname += name;
		const r = await requestUrl({ url: u.href, throw: false });
		const ab: ArrayBuffer = await Promise.resolve(r.arrayBuffer);
		return { status: r.status, bytes: new Uint8Array(ab) };
	};

	const manRes = await get("manifest.json");
	if (manRes.status < 200 || manRes.status >= 300) {
		return { ok: false, error: "manifest HTTP " + manRes.status };
	}
	const manifestText = new TextDecoder().decode(manRes.bytes);
	const parsed = parseManifest(manifestText);
	if (!("manifest" in parsed)) return { ok: false, error: "manifest:" + parsed.error };

	const mainRes = await get("main.js");
	if (mainRes.status < 200 || mainRes.status >= 300) {
		return { ok: false, error: "main.js HTTP " + mainRes.status };
	}
	if (mainRes.bytes.byteLength === 0) return { ok: false, error: "empty-main" };

	let stylesCss: string | null = null;
	const styleRes = await get("styles.css");
	if (styleRes.status >= 200 && styleRes.status < 300) {
		stylesCss = new TextDecoder().decode(styleRes.bytes);
	} else if (styleRes.status !== 404 && styleRes.status !== 410) {
		// 500/403 當缺失會誤刪已裝好的舊樣式，此處僅對缺 styles 寬容
		return { ok: false, error: "styles.css HTTP " + styleRes.status };
	}
	// icon.svg 可選：404/410 缺席；其他非 2xx 視為異常但不阻塞（圖標非必需）
	let iconSvg: Uint8Array | null = null;
	const iconRes = await get("icon.svg");
	if (iconRes.status >= 200 && iconRes.status < 300 && iconRes.bytes.byteLength > 0) {
		iconSvg = iconRes.bytes;
	}
	return { ok: true, files: { manifest: parsed.manifest, mainJs: mainRes.bytes, manifestText, stylesCss, iconSvg } };
}

/** 模式 B：下載 zip 並復用 zip 管線解析（路徑穿越/條目數/大小防護全部生效）。 */
export async function fetchRemoteZip(url: URL): Promise<{ ok: true; files: ReturnType<typeof parseZipManifest> & object } | { ok: false; error: string }> {
	// normalizeRootUrl 補的尾斜線對 zip 檔案是 404 來源——fetch 前剝除
	const zipUrl = new URL(url.href);
	zipUrl.pathname = zipUrl.pathname.replace(/\/+$/, "");
	const r = await requestUrl({ url: zipUrl.href, throw: false });
	const buf: ArrayBuffer = await Promise.resolve(r.arrayBuffer);
	if (r.status < 200 || r.status >= 300) return { ok: false, error: "zip HTTP " + r.status };
	const parsed = parseZipManifest(new Uint8Array(buf));
	if (!("manifest" in parsed)) return { ok: false, error: "zip:" + parsed.error };
	return { ok: true, files: parsed };
}

/**
 * 遠程安裝總入口：判定 zip/裸目錄 → 抓取 → 寫盤（復用 tmp 流程）→ 啟用。
 * 覆蓋備份與 installFromFolder/installFromZip 一致。
 */
export type ResolvedRemote =
	| { kind: "archive"; manifest: Manifest; files: Map<string, Uint8Array> }
	| { kind: "dir"; manifest: Manifest; mainJs: Uint8Array; manifestText: string; stylesCss: string | null; iconSvg: Uint8Array | null };

/** 只抓取不寫盤（確認卡前置：fetch → 確認 → commit）。 */
export async function resolveRemoteUrl(url: string): Promise<{ ok: true; value: ResolvedRemote } | { ok: false; error: string }> {
	const root = normalizeRootUrl(url);
	if (!root) return { ok: false, error: "bad-url" };
	if (looksLikeZipUrl(root)) {
		const fetched = await fetchRemoteZip(root);
		if (!fetched.ok) return { ok: false, error: fetched.error };
		const { manifest, files } = fetched.files as { manifest: Manifest; files: Map<string, Uint8Array> };
		return { ok: true, value: { kind: "archive", manifest, files } };
	}
	const fetched = await fetchRemoteDir(root);
	if (!fetched.ok) return { ok: false, error: fetched.error };
	const { manifest, mainJs, manifestText, stylesCss, iconSvg } = fetched.files;
	return { ok: true, value: { kind: "dir", manifest, mainJs, manifestText, stylesCss, iconSvg } };
}

export async function installFromUrl(app: App, url: string, opts: InstallOptions): Promise<{ ok: true; manifest: Manifest; backedUpTo: string | null } | { ok: false; error: string }> {
	const resolved = await resolveRemoteUrl(url);
	if (!resolved.ok) return resolved;
	return commitRemote(app, resolved.value, url, opts);
}

/** 寫盤＋啟用（確認後執行；備份/啟用與既有路徑一致）。 */
export async function commitRemote(app: App, resolved: ResolvedRemote, sourceUrl: string, opts: InstallOptions): Promise<{ ok: true; manifest: Manifest; backedUpTo: string | null } | { ok: false; error: string }> {
	if (resolved.kind === "archive") {
		return installFromZip(app, { zipPath: sourceUrl, manifest: resolved.manifest, error: null }, resolved.files, opts);
	}
	const { manifest: man, mainJs, stylesCss, iconSvg } = resolved;
	const adapter = app.vault.adapter;
	const targetDir = normalizePath(app.vault.configDir + "/plugins/" + man.id);

	// 覆蓋備份（與本地安裝一致；自更新除外）；備份目錄用舊版 manifest 版本號
	// 備份成功才動寫盤；寫盤走 tmp 目錄（與 folder/zip 路徑同構），成功後整目錄替換
	// ——避免 dir 直寫把殘留舊檔留進新版，也避免半寫狀態
	let backedUpTo: string | null = null;
	if ((await adapter.exists(targetDir)) && opts.backupOnOverwrite && man.id !== "pluscan") {
		let oldVersion = "unknown";
		const oldManPath = normalizePath(targetDir + "/manifest.json");
		if (await adapter.exists(oldManPath)) {
			try {
				const oldMan = JSON.parse(await adapter.read(oldManPath)) as { version?: string };
				if (oldMan.version) oldVersion = oldMan.version;
			} catch {
				// 舊 manifest 損壞 → 用 unknown
			}
		}
		const backupDir = normalizePath(opts.backupFolder + "/" + man.id + "/" + oldVersion);
		try {
			await copyExisting(app, targetDir, backupDir);
		} catch (e) {
			// 備份失敗＝繼續會在無保護下覆蓋舊版，中止安裝
			return { ok: false, error: "backup-failed:" + String(e) };
		}
		backedUpTo = backupDir;
	}

	const tmpDir = normalizePath(targetDir + ".pluscan-tmp-" + Date.now());
	if (await adapter.exists(tmpDir)) await adapter.rmdir(tmpDir, true);
	try {
		await adapter.mkdir(tmpDir);
		await adapter.writeBinary(normalizePath(tmpDir + "/main.js"), mainJs);
		await adapter.write(normalizePath(tmpDir + "/manifest.json"), JSON.stringify(man, null, 2));
		if (stylesCss != null) await adapter.write(normalizePath(tmpDir + "/styles.css"), stylesCss);
		if (iconSvg != null) await adapter.writeBinary(normalizePath(tmpDir + "/icon.svg"), iconSvg);
		if (man.id === "pluscan") {
			// 自更新：不刪運行中的自身目錄（失敗會自毀），原地覆蓋三件套
			await copyExisting(app, tmpDir, targetDir);
		} else {
			const oldStyles = normalizePath(targetDir + "/styles.css");
			if (stylesCss == null && (await adapter.exists(targetDir)) && (await adapter.exists(oldStyles))) {
				await adapter.remove(oldStyles); // 新版缺 styles 刪舊檔
			}
			const oldIcon = normalizePath(targetDir + "/icon.svg");
			if (iconSvg == null && (await adapter.exists(targetDir)) && (await adapter.exists(oldIcon))) {
				await adapter.remove(oldIcon); // 新版缺 icon 刪舊檔
			}
			if (await adapter.exists(targetDir)) await adapter.rmdir(targetDir, true);
			await adapter.mkdir(targetDir);
			await copyExisting(app, tmpDir, targetDir);
		}
		await adapter.rmdir(tmpDir, true);
	} catch (e) {
		if (await adapter.exists(tmpDir)) await adapter.rmdir(tmpDir, true);
		return { ok: false, error: String(e) };
	}

	const plugins = (app as unknown as { plugins: { plugins: Record<string, unknown>; loadManifests(): Promise<void>; disablePlugin(id: string): Promise<void>; enablePluginAndSave(id: string): Promise<void> } }).plugins;
	await plugins.loadManifests();
	if (man.id === "pluscan") return { ok: true, manifest: man, backedUpTo };
	if (opts.autoEnable) {
		if (plugins.plugins[man.id]) await plugins.disablePlugin(man.id);
		await plugins.enablePluginAndSave(man.id);
		if (!plugins.plugins[man.id]) return { ok: false, error: "enable-failed" };
	}
	return { ok: true, manifest: man, backedUpTo };
}

async function copyExisting(app: App, from: string, to: string): Promise<void> {
	const adapter = app.vault.adapter;
	if (!(await adapter.exists(to))) await adapter.mkdir(to);
	const { files, folders } = await adapter.list(from);
	for (const f of files) await adapter.writeBinary(normalizePath(to + "/" + f.slice(from.length + 1)), await adapter.readBinary(f));
	for (const d of folders) if (d !== from) await copyExisting(app, d, normalizePath(to + "/" + d.slice(from.length + 1)));
}
