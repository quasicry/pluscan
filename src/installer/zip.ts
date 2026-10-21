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

// zip / tar / tar.gz 掃描＋安全解壓。US-003。
// 安全防護（PRD 第四節）：路徑穿越拒絕、條目數/總大小上限、僅取常规檔案。
// gzip 用 fflate gunzipSync（既有依賴）；tar 為最小同步 USTAR 解析器（含 GNU long name 與 PAX path 支援）。
import { TFile, Vault, normalizePath } from "obsidian";
import { unzipSync, gunzipSync } from "fflate";
import { parseManifest, type Manifest } from "../scanner/scanner";

const MAX_ENTRIES = 500;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;

export type ArchiveManifestResult = { manifest: Manifest; files: Map<string, Uint8Array> } | { error: string };

export interface ZipCandidate {
	zipPath: string;
	manifest: Manifest | null;
	error: string | null;
}

/** 掃描/遠程共用的壓縮檔副檔名判定（tar.gz 在 vault 內 extension='gz'）。 */
export function isArchiveName(name: string): boolean {
	const n = name.toLowerCase();
	return n.endsWith(".zip") || n.endsWith(".tar") || n.endsWith(".tar.gz") || n.endsWith(".tgz");
}

/** 遠程 URL 判定：路徑末段為 zip/tar/tgz/tar.gz（允許尾隨斜線）。 */
export function looksLikeArchiveUrl(url: URL): boolean {
	return /\/[^/]*\.(zip|tar|tar\.gz|tgz)\/?$/i.test(url.pathname);
}

/** 拒絕壓縮檔條目路徑穿越與絕對路徑（返回 null 表示丟棄該條目）。 */
export function safeEntryPath(name: string): string | null {
	if (name.startsWith("/") || name.includes("\\") || name.includes("..")) return null;
	if (name.endsWith("/")) return null; // 目錄條目不需要
	return name;
}

// ---------- tar ----------

const BLOCK = 512;

/** 是否 gzip 魔數（1f 8b）。 */
function isGzip(bytes: Uint8Array): boolean {
	return bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

/** 讀 tar header 的八進位欄位（容忍空格/零填充）。 */
function octal(buf: Uint8Array, off: number, len: number): number {
	let s = "";
	for (let i = 0; i < len; i++) {
		const c = buf[off + i];
		if (c === 0 || c === 0x20) {
			if (s.length > 0) break;
			continue;
		}
		s += String.fromCharCode(c);
	}
	if (!s) return 0;
	return parseInt(s, 8) || 0;
}

function readString(buf: Uint8Array, off: number, len: number): string {
	let out = "";
	for (let i = 0; i < len; i++) {
		const c = buf[off + i];
		if (c === 0) break;
		out += String.fromCharCode(c);
	}
	return out;
}

/** 解析 tar（未壓縮位元組流）→ 檔案映射。穿越條目丟棄；僅常规檔案（typeflag 0/'0'）。 */
function untarSync(bytes: Uint8Array): Map<string, Uint8Array> | { error: string } {
	const out = new Map<string, Uint8Array>();
	let off = 0;
	let pendingLongName: string | null = null; // GNU L / PAX path
	while (off + BLOCK <= bytes.length) {
		// 兩個全零塊＝結尾
		let zero = true;
		for (let i = 0; i < BLOCK; i++) {
			if (bytes[off + i] !== 0) {
				zero = false;
				break;
			}
		}
		if (zero) break;
		const name = readString(bytes, off, 100);
		const size = octal(bytes, off + 124, 12);
		const typeflag = String.fromCharCode(bytes[off + 156] || 0x30);
		const prefix = readString(bytes, off + 345, 155);
		const dataStart = off + BLOCK;
		const dataEnd = dataStart + size;
		if (dataEnd > bytes.length) return { error: "tar-corrupt" };
		const data = bytes.slice(dataStart, dataEnd);

		if (typeflag === "L") {
			pendingLongName = readString(data, 0, data.length);
		} else if (typeflag === "x") {
			// PAX 擴展頭：找 "len path=...\n"
			const text = readString(data, 0, data.length);
			const m = /(?:^|\n)\d+ path=([^\n]*)/.exec(text);
			if (m) pendingLongName = m[1];
		} else if (typeflag === "0" || typeflag === "\0" || typeflag === "") {
			const raw = pendingLongName ?? (prefix ? prefix + "/" + name : name);
			pendingLongName = null;
			const p = safeEntryPath(raw);
			if (p) out.set(p, data);
		} else {
			pendingLongName = null; // 目錄/連結/特殊檔案：跳過
		}
		off = dataStart + Math.ceil(size / BLOCK) * BLOCK;
	}
	if (out.size > MAX_ENTRIES) return { error: "zip-too-many" };
	let total = 0;
	for (const d of out.values()) total += d.length;
	if (total > MAX_TOTAL_BYTES) return { error: "zip-too-large" };
	return out;
}

// ---------- manifest 定位（zip/tar 共用語義） ----------

/** 在檔案映射中定位 manifest.json（頂層或唯一頂層子目錄）並裁剪根前綴。 */
function locateManifest(files: Map<string, Uint8Array>): ArchiveManifestResult {
	let manifestText: string | null = null;
	const direct = files.get("manifest.json");
	if (direct) {
		manifestText = new TextDecoder().decode(direct);
	} else {
		const tops = new Set<string>();
		for (const p of files.keys()) tops.add(p.split("/")[0]);
		if (tops.size === 1) {
			const root = tops.values().next().value as string;
			const nested = files.get(root + "/manifest.json");
			if (nested) manifestText = new TextDecoder().decode(nested);
		}
	}
	if (!manifestText) return { error: "no-manifest" };
	const parsed = parseManifest(manifestText);
	if (!("manifest" in parsed)) return { error: parsed.error };
	const man = parsed.manifest;
	let prefix = "";
	if (!direct) {
		const root = (files.keys().next().value as string).split("/")[0];
		prefix = root + "/";
	}
	const stripped = new Map<string, Uint8Array>();
	for (const [p, data] of files) {
		if (prefix && !p.startsWith(prefix)) continue;
		stripped.set(prefix ? p.slice(prefix.length) : p, data);
	}
	return { manifest: man, files: stripped };
}

/** 校驗 512 位元組塊是否為合法 tar header（ustar magic 或 checksum）。 */
function looksLikeTarHeader(b: Uint8Array, off: number): boolean {
	if (off + BLOCK > b.length) return false;
	// ustar magic（257 起 "ustar"）
	if (readString(b, off + 257, 5) === "ustar") return true;
	// checksum 欄位（148-156 八進位）＝頭部其餘欄位和
	const chk = octal(b, off + 148, 8);
	let sum = 0;
	for (let i = 0; i < BLOCK; i++) sum += i >= 148 && i < 156 ? 0x20 : b[off + i];
	return chk === sum && sum > 0;
}

/** 從 zip / tar / tar.gz 二進位中解析 manifest.json（魔數自動分流）。 */
export function parseZipManifest(bytes: Uint8Array): ArchiveManifestResult {
	const isZip = bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
	const isTarGz = isGzip(bytes);
	const isTar = !isZip && !isTarGz && looksLikeTarHeader(bytes, 0);
	if (isTarGz || isTar) {
		let tar: Uint8Array;
		if (isTarGz) {
			try {
				tar = gunzipSync(bytes);
			} catch {
				return { error: "tar-corrupt" };
			}
		} else {
			tar = bytes;
		}
		const files = untarSync(tar);
		if ("error" in files) return files;
		return locateManifest(files);
	}
	let files: Record<string, Uint8Array>;
	try {
		files = unzipSync(bytes);
	} catch {
		return { error: "zip-corrupt" };
	}
	const names = Object.keys(files);
	if (names.length > MAX_ENTRIES) return { error: "zip-too-many" };
	let total = 0;
	for (const n of names) total += files[n].length;
	if (total > MAX_TOTAL_BYTES) return { error: "zip-too-large" };

	const safe = new Map<string, Uint8Array>();
	for (const n of names) {
		const p = safeEntryPath(n);
		if (p) safe.set(p, files[n]);
	}
	return locateManifest(safe);
}

/** 掃描配置文件夾內的 zip/tar/tar.gz 檔候選。 */
export async function scanVaultZips(vault: Vault, scanFolders: string): Promise<ZipCandidate[]> {
	const folders = scanFolders
		.split(",")
		.map((s) => normalizePath(s.trim()))
		.filter((s) => s.length > 0);
	const out: ZipCandidate[] = [];
	for (const folder of folders) {
		const listing = vault.getAbstractFileByPath(folder);
		if (!listing || !("children" in listing)) continue;
		for (const child of (listing as { children: unknown[] }).children) {
			if (!(child instanceof TFile) || !isArchiveName(child.name)) continue;
			try {
				const bytes = new Uint8Array(await vault.readBinary(child));
				const parsed = parseZipManifest(bytes);
				out.push(
					"manifest" in parsed
						? { zipPath: child.path, manifest: parsed.manifest, error: null }
						: { zipPath: child.path, manifest: null, error: parsed.error },
				);
			} catch (e) {
				out.push({ zipPath: child.path, manifest: null, error: String(e) });
			}
		}
	}
	return out;
}
