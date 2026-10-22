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

// 掃描器：在 vault 指定文件夾找裸目錄（含 manifest.json）候選。US-001。
import { App, TFile, normalizePath, type TAbstractFile } from "obsidian";
import { ID_PATTERN } from "../settings";

export interface Candidate {
	/** vault 內插件文件夾路徑，如 "_plugins/my-plugin" */
	folderPath: string;
	manifest: Manifest | null;
	error: string | null;
}

export interface Manifest {
	id: string;
	name?: string;
	version: string;
	minAppVersion?: string;
	description?: string;
	isDesktopOnly?: boolean;
}

/**
 * 讀取並校驗一個 manifest.json 文本。
 * 校驗規則（PRD 第四節）：id 白名單、不以 - 結尾且無連續連字號、version 存在。
 */
export function parseManifest(text: string): { manifest: Manifest } | { error: string } {
	let man: Manifest;
	try {
		man = JSON.parse(text) as Manifest;
	} catch {
		return { error: "json" };
	}
	if (typeof man.id !== "string" || !ID_PATTERN.test(man.id) || man.id.length > 100) {
		return { error: "id" };
	}
	if (typeof man.version !== "string" || man.version.length === 0) {
		return { error: "version" };
	}
	return { manifest: man };
}

/** 掃描全部配置文件夾，返回含 manifest.json 的裸目錄候選。 */
export async function scanVaultFolders(vault: App["vault"], scanFolders: string): Promise<Candidate[]> {
	const folders = scanFolders
		.split(",")
		.map((s) => normalizePath(s.trim()))
		.filter((s) => s.length > 0);

	const candidates: Candidate[] = [];
	const seen = new Set<string>();

	for (const folderPath of folders) {
		const folder = vault.getAbstractFileByPath(folderPath);
		// duck typing 判目錄（跨 realm instanceof 不可靠，Obsidian 1.14 實證）
		if (!folder || !("children" in folder)) continue;
		for (const child of (folder as { children: TAbstractFile[] }).children) {
			if (!("children" in child)) continue;
			// 1.14 實證：跨 realm instanceof TFolder 失效（同文件夾不匹配）——duck typing 存取 children
			const folderLike = child as unknown as { children: TAbstractFile[] };
			const mf = folderLike.children.find((c): c is TFile => c instanceof TFile && c.name === "manifest.json");
			if (!mf || seen.has(child.path)) continue;
			seen.add(child.path);
			try {
				const text = await vault.read(mf);
				const parsed = parseManifest(text);
				candidates.push(
					"manifest" in parsed
						? { folderPath: child.path, manifest: parsed.manifest, error: null }
						: { folderPath: child.path, manifest: null, error: parsed.error },
				);
			} catch (e) {
				candidates.push({ folderPath: child.path, manifest: null, error: String(e) });
			}
		}
	}
	return candidates;
}
