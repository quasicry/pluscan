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

// 安裝器：vault 內裸目錄 → .obsidian/plugins/<id>/ 原子導入＋啟用。US-002。
// 防護：manifest 預檢、minAppVersion、臨時目錄 rename 原子寫盤、覆蓋備份（PRD 第三/四節）。
import { App, normalizePath } from "obsidian";
import type { Candidate, Manifest } from "../scanner/scanner";
import { parseManifest } from "../scanner/scanner";
import { requireApiVersionSafe } from "./compat";
import type { ZipCandidate } from "./zip";

/** 把 zip 解出的檔案映射寫入目標目錄（已被 zip.ts 安全路徑過濾）。 */
async function writeZipFiles(app: App, files: Map<string, Uint8Array>, to: string): Promise<void> {
	const adapter = app.vault.adapter;
	for (const [rel, data] of files) {
		const target = normalizePath(to + "/" + rel);
		const dir = target.slice(0, target.lastIndexOf("/"));
		if (dir && !(await adapter.exists(dir))) await adapter.mkdir(dir);
		await adapter.writeBinary(target, data);
	}
}

/**
 * 從 vault 內 zip 安裝插件。流程與 installFromFolder 相同，來源改為解壓映射。
 */
export async function installFromZip(app: App, candidate: ZipCandidate, zipFiles: Map<string, Uint8Array>, opts: InstallOptions): Promise<InstallResult> {
	if (!candidate.manifest) {
		return { ok: false, error: "zip:" + (candidate.error ?? "unknown") };
	}
	const man = candidate.manifest;
	const plugins = (app as unknown as { plugins: PluginManager }).plugins;

	if (man.minAppVersion && !requireApiVersionSafe(man.minAppVersion)) {
		return { ok: false, error: "minapp:" + man.minAppVersion, manifest: man };
	}

	const adapter = app.vault.adapter;
	const targetDir = normalizePath(app.vault.configDir + "/plugins/" + man.id);
	const tmpDir = normalizePath(targetDir + ".pluscan-tmp-" + Date.now());
	const selfDir = normalizePath(app.vault.configDir + "/plugins/" + PLUGIN_ID_SELF);

	let backedUpTo: string | null = null;
	if ((await adapter.exists(targetDir)) && opts.backupOnOverwrite && man.id !== PLUGIN_ID_SELF) {
		const existing = await readPluginFiles(app, targetDir);
		const existingMan = existing.get("manifest.json");
		const oldVersion = existingMan ? (parseManifest(new TextDecoder().decode(existingMan)) as { manifest?: Manifest }).manifest?.version ?? "unknown" : "unknown";
		const backupDir = normalizePath(opts.backupFolder + "/" + man.id + "/" + oldVersion);
		try {
			await copyDir(app, targetDir, backupDir);
		} catch (e) {
			// 備份失敗＝繼續會在無保護下覆蓋舊版，中止安裝
			return { ok: false, error: "backup-failed:" + String(e), manifest: man };
		}
		backedUpTo = backupDir;
	}

	try {
		await removeDir(app, tmpDir);
		await adapter.mkdir(tmpDir);
		await writeZipFiles(app, zipFiles, tmpDir);
		const mainJs = await adapter.readBinary(normalizePath(tmpDir + "/main.js"));
		if (mainJs.byteLength === 0) return { ok: false, error: "empty-main", manifest: man };
		if (man.id === PLUGIN_ID_SELF) {
			// 自更新：不刪除運行中的自身目錄（失敗會自毀），原地覆蓋後提示重啟
			await copyDir(app, tmpDir, selfDir);
		} else {
			await removeDir(app, targetDir);
			await copyDir(app, tmpDir, targetDir);
		}
		await removeDir(app, tmpDir);
	} catch (e) {
		await removeDir(app, tmpDir);
		return { ok: false, error: String(e), manifest: man };
	}

	if (!(await adapter.exists(targetDir)) && man.id !== PLUGIN_ID_SELF) {
		return { ok: false, error: "write-failed", manifest: man };
	}

	await plugins.loadManifests();
	if (man.id === PLUGIN_ID_SELF) {
		return { ok: true, manifest: man, backedUpTo };
	}
	if (opts.autoEnable) {
		if (plugins.plugins[man.id]) await plugins.disablePlugin(man.id);
		await plugins.enablePluginAndSave(man.id);
		if (!plugins.plugins[man.id]) {
			return { ok: false, error: "enable-failed", manifest: man };
		}
	}
	return { ok: true, manifest: man, backedUpTo };
}

/** Obsidian 內部插件管理接口（未公開類型，僅聲明用到的方法）。 */
interface PluginManager {
	plugins: Record<string, unknown>;
	loadManifests(): Promise<void>;
	disablePlugin(id: string): Promise<void>;
	enablePluginAndSave(id: string): Promise<void>;
}

export interface InstallOptions {
	confirmBeforeInstall: boolean;
	autoEnable: boolean;
	backupOnOverwrite: boolean;
	backupFolder: string;
}

export type InstallResult =
	| { ok: true; manifest: Manifest; backedUpTo: string | null }
	| { ok: false; error: string; manifest?: Manifest };

const PLUGIN_ID_SELF = "pluscan";

/** 遞迴複製 vault 目錄（adapter 級，逐檔）。 */
async function copyDir(app: App, from: string, to: string): Promise<void> {
	const adapter = app.vault.adapter;
	if (!(await adapter.exists(from))) return;
	if (!(await adapter.exists(to))) await adapter.mkdir(to);
	const listing = adapter.list(from);
	for (const f of (await listing).files) {
		const data = await adapter.readBinary(f);
		const target = normalizePath(to + "/" + f.slice(from.length + 1));
		await adapter.writeBinary(target, data);
	}
	for (const d of (await listing).folders) {
		if (d === from) continue;
		await copyDir(app, d, normalizePath(to + "/" + d.slice(from.length + 1)));
	}
}

async function removeDir(app: App, dir: string): Promise<void> {
	if (await app.vault.adapter.exists(dir)) await app.vault.adapter.rmdir(dir, true);
}

/** 讀目錄內全部檔案為相對路徑 → 內容映射（插件三件套＋子目錄）。 */
async function readPluginFiles(app: App, dir: string): Promise<Map<string, Uint8Array>> {
	const out = new Map<string, Uint8Array>();
	const adapter = app.vault.adapter;
	const walk = async (base: string, rel: string): Promise<void> => {
		const { files, folders } = await adapter.list(rel ? normalizePath(base + "/" + rel) : base);
		for (const f of files) {
			const name = f.slice(base.length + 1);
			out.set(name, new Uint8Array(await adapter.readBinary(f)));
		}
		for (const d of folders) {
			if (d === base) continue;
			await walk(base, d.slice(base.length + 1));
		}
	};
	await walk(dir, "");
	return out;
}

/**
 * 從 vault 內裸目錄安裝插件。
 * 流程：解析 manifest → minAppVersion 預檢 →（可選確認由 UI 層處理）→
 * 舊版備份 → 寫入 .tmp 目錄 → rename 原子生效 → loadManifests → 啟用。
 */
export async function installFromFolder(app: App, candidate: Candidate, opts: InstallOptions): Promise<InstallResult> {
	if (!candidate.manifest) {
		return { ok: false, error: "manifest:" + (candidate.error ?? "unknown") };
	}
	const man = candidate.manifest;
	const plugins = (app as unknown as { plugins: PluginManager }).plugins;

	// minAppVersion 預檢：寫盤不可逆，先確認這版跑得起
	if (man.minAppVersion && !requireApiVersionSafe(man.minAppVersion)) {
		return { ok: false, error: "minapp:" + man.minAppVersion, manifest: man };
	}

	const adapter = app.vault.adapter;
	const targetDir = normalizePath(app.vault.configDir + "/plugins/" + man.id);
	const tmpDir = normalizePath(targetDir + ".pluscan-tmp-" + Date.now());
	const selfDir = normalizePath(app.vault.configDir + "/plugins/" + PLUGIN_ID_SELF);

	// 覆蓋保護：備份舊版（不含自更新——備份自己會在 rename 時自我覆蓋）
	let backedUpTo: string | null = null;
	if ((await adapter.exists(targetDir)) && opts.backupOnOverwrite && man.id !== PLUGIN_ID_SELF) {
		const existing = await readPluginFiles(app, targetDir);
		const existingMan = existing.get("manifest.json");
		const oldVersion = existingMan ? (parseManifest(new TextDecoder().decode(existingMan)) as { manifest?: Manifest }).manifest?.version ?? "unknown" : "unknown";
		const backupDir = normalizePath(opts.backupFolder + "/" + man.id + "/" + oldVersion);
		try {
			await copyDir(app, targetDir, backupDir);
		} catch (e) {
			// 備份失敗＝繼續會在無保護下覆蓋舊版，中止安裝
			return { ok: false, error: "backup-failed:" + String(e), manifest: man };
		}
		backedUpTo = backupDir;
	}

	// 原子寫盤：先寫 tmp，再整目錄替換
	try {
		await removeDir(app, tmpDir);
		await copyDir(app, candidate.folderPath, tmpDir);
		// main.js 必須存在且非空
		const mainJs = await adapter.readBinary(normalizePath(tmpDir + "/main.js"));
		if (mainJs.byteLength === 0) return { ok: false, error: "empty-main", manifest: man };
		if (man.id === PLUGIN_ID_SELF) {
			// 自更新：不刪除運行中的自身目錄（失敗會自毀），原地覆蓋後提示重啟
			await copyDir(app, tmpDir, selfDir);
		} else {
			await removeDir(app, targetDir);
			await copyDir(app, tmpDir, targetDir);
		}
		await removeDir(app, tmpDir);
	} catch (e) {
		await removeDir(app, tmpDir);
		return { ok: false, error: String(e), manifest: man };
	}

	if (!(await adapter.exists(targetDir)) && man.id !== PLUGIN_ID_SELF) {
		return { ok: false, error: "write-failed", manifest: man };
	}

	// 讓 Obsidian 認到新插件
	await plugins.loadManifests();
	if (man.id === PLUGIN_ID_SELF) {
		return { ok: true, manifest: man, backedUpTo };
	}
	if (opts.autoEnable) {
		if (plugins.plugins[man.id]) await plugins.disablePlugin(man.id);
		await plugins.enablePluginAndSave(man.id);
		if (!plugins.plugins[man.id]) {
			return { ok: false, error: "enable-failed", manifest: man };
		}
	}
	return { ok: true, manifest: man, backedUpTo };
}
