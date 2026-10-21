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

// 候選列表 Modal：掃描出的多個候選（裸目錄＋壓縮包）一次列出、勾選批量安裝。
// 規範：DOM 全走 createEl、Sentence case、無硬編碼樣式（官方 CSS 變量）。
import { App, Modal, Notice, requireApiVersion } from "obsidian";
import type { Candidate } from "../scanner/scanner";
import type { ZipCandidate } from "../installer/zip";
import type { EnStrings } from "../i18n";

/** 列表中的一行候選（folder 或 zip，已解析 manifest；壞候選也列出但不可選）。 */
export interface ListEntry {
	/** 顯示來源路徑（zip 為檔案路徑） */
	source: string;
	kind: "folder" | "zip";
	folder?: Candidate;
	zip?: ZipCandidate;
	name: string;
	id: string;
	version: string;
	compatible: boolean;
	/** 同 id 已安裝（將覆蓋） */
	overwrite: boolean;
	/** manifest 無效等——不可安裝 */
	broken: string | null;
}

export class CandidateListModal extends Modal {
	private checkboxes = new Map<ListEntry, HTMLInputElement>();
	private go: HTMLButtonElement | null = null;

	constructor(
		app: App,
		private entries: ListEntry[],
		private strings: EnStrings,
		private onInstall: (selected: ListEntry[]) => Promise<void>,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		const s = this.strings;

		contentEl.createEl("h3", { text: s.scanner.heading });
		if (this.entries.length === 0) {
			contentEl.createDiv({ text: s.scanner.empty, cls: "setting-item-description" });
			return;
		}

		const list = contentEl.createDiv({ cls: "pluscan-candidate-list" });
		for (const entry of this.entries) {
			const row = list.createDiv({ cls: "pluscan-candidate" });
			const meta = row.createDiv({ cls: "pluscan-candidate-meta" });
			const title = meta.createDiv({ cls: "pluscan-candidate-title" });
			title.createSpan({ text: entry.name });
			const sub = meta.createDiv({ cls: "pluscan-candidate-sub" });
			const state: string[] = [`${entry.id} ${entry.version}`, entry.source];
			if (entry.broken) {
				state.push(entry.broken);
			} else if (!entry.compatible) {
				state.push(s.confirm.incompatible);
			} else if (entry.overwrite) {
				state.push(s.scanner.installed);
			}
			sub.createSpan({ text: state.join(" · ") });
			if (entry.broken || !entry.compatible) {
				row.addClass("pluscan-candidate-disabled");
			} else {
				const check = row.createEl("input", { type: "checkbox" });
				check.checked = !entry.overwrite; // 新插件默認勾選；覆蓋默認不勾（保守）
				check.addEventListener("change", () => this.updateButtons());
				this.checkboxes.set(entry, check);
			}
		}

		const actions = contentEl.createDiv({ cls: "pluscan-confirm-actions" });
		const installAll = actions.createEl("button", { text: s.scanner.installAll });
		installAll.addEventListener("click", () => {
			for (const check of this.checkboxes.values()) check.checked = true;
			this.updateButtons();
		});
		const installNone = actions.createEl("button", { text: s.scanner.installNone });
		installNone.addEventListener("click", () => {
			for (const check of this.checkboxes.values()) check.checked = false;
			this.updateButtons();
		});
		this.go = actions.createEl("button", { text: s.scanner.installSelected, cls: "mod-cta" });
		this.go.addEventListener("click", () => void this.submit());
		actions.createEl("button", { text: s.common.cancel }).addEventListener("click", () => this.close());
		this.updateButtons();
	}

	private updateButtons(): void {
		if (!this.go) return;
		const n = this.selectedCount();
		this.go.textContent = this.strings.scanner.installSelectedCount(n);
		this.go.disabled = n === 0;
	}

	private selectedCount(): number {
		let n = 0;
		for (const check of this.checkboxes.values()) if (check.checked) n += 1;
		return n;
	}

	private async submit(): Promise<void> {
		const selected: ListEntry[] = [];
		for (const [entry, check] of this.checkboxes) if (check.checked) selected.push(entry);
		if (selected.length === 0) return;
		if (this.go) {
			this.go.disabled = true;
			this.go.textContent = this.strings.urlInstall.installing;
		}
		try {
			await this.onInstall(selected);
			this.close();
		} catch (e) {
			new Notice(this.strings.notices.installFailed(String(e)), 8000);
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

/** 把掃描結果組裝成列表條目。 */
export function buildListEntries(candidates: Candidate[], zips: ZipCandidate[], installedIds: Set<string>, strings: EnStrings): ListEntry[] {
	const entries: ListEntry[] = [];
	for (const c of candidates) {
		const man = c.manifest;
		entries.push({
			source: c.folderPath,
			kind: "folder",
			folder: c,
			name: man?.name ?? man?.id ?? c.folderPath.split("/").pop() ?? c.folderPath,
			id: man?.id ?? "—",
			version: man?.version ?? "—",
			compatible: man?.minAppVersion ? requireApiVersion(man.minAppVersion) : true,
			overwrite: man ? installedIds.has(man.id) : false,
			broken: man ? null : `${c.folderPath}: ${strings.notices.invalidManifest}`,
		});
	}
	for (const z of zips) {
		const man = z.manifest;
		entries.push({
			source: z.zipPath,
			kind: "zip",
			zip: z,
			name: man?.name ?? man?.id ?? z.zipPath.split("/").pop() ?? z.zipPath,
			id: man?.id ?? "—",
			version: man?.version ?? "—",
			compatible: man?.minAppVersion ? requireApiVersion(man.minAppVersion) : true,
			overwrite: man ? installedIds.has(man.id) : false,
			broken: man ? null : `${z.zipPath}: ${strings.notices.invalidManifest}`,
		});
	}
	return entries;
}
