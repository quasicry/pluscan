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

// 安裝前確認卡（Modal）。規範：DOM 全走 createEl、Sentence case、無硬編碼樣式。
import { App, MarkdownRenderer, Modal, requireApiVersion, type Component } from "obsidian";
import { isDesktopCompatible } from "../installer/compat";
import type { Candidate } from "../scanner/scanner";
import type { EnStrings } from "../i18n";

export class ConfirmModal extends Modal {
	constructor(
		app: App,
		private candidate: Candidate,
		private strings: EnStrings,
		private overwrite: boolean,
		private onConfirm: () => void,
		private changelog: string | null = null,
		private componentHost?: Component,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		const man = this.candidate.manifest;
		const s = this.strings;

		const card = contentEl.createDiv({ cls: "pluscan-confirm-card" });
		card.createEl("h3", { text: s.confirm.heading });

		const rows: [string, string][] = [
			[s.confirm.pluginId, man?.id ?? "—"],
			["version", man?.version ?? "—"],
			[s.confirm.minApp, man?.minAppVersion ?? "—"],
		];
		for (const [label, value] of rows) {
			const row = card.createDiv({ cls: "pluscan-confirm-row" });
			row.createSpan({ cls: "pluscan-confirm-label", text: label });
			row.createSpan({ cls: "pluscan-confirm-value", text: value });
		}

		const compat = card.createDiv({ cls: "pluscan-confirm-compat" });
		let compatOk = true;
		if (man?.minAppVersion) {
			compatOk = requireApiVersion(man.minAppVersion);
			compat.createSpan({
				cls: compatOk ? "pluscan-compat-ok" : "pluscan-compat-warn",
				text: compatOk ? s.confirm.compatible : s.confirm.incompatible,
			});
		} else {
			compat.createSpan({ cls: "pluscan-compat-ok", text: s.confirm.compatible });
		}
		if (man?.isDesktopOnly && !isDesktopCompatible(man.isDesktopOnly)) {
			compat.createSpan({
				cls: "pluscan-compat-warn",
				text: s.confirm.mobileUnsupported,
			});
		}
		if (this.overwrite) {
			card.createDiv({ cls: "pluscan-confirm-overwrite" }).createSpan({
				cls: "pluscan-compat-warn",
				text: s.confirm.overwriteWarn,
			});
		}

		// 變更日誌預檢（before 模式）：Markdown 渲染，確認前不寫任何文件
		const cl = this.changelog;
		if (cl !== null) {
			const clHead = card.createDiv({ cls: "pluscan-confirm-changelog-head", text: s.confirm.changelogHeading });
			void MarkdownRenderer.render(this.app, cl, clHead.createDiv({ cls: "pluscan-confirm-changelog-body" }), this.pluginSourcePath(), this.componentHost as Component);
			if (cl === "") {
				clHead.createDiv({ cls: "pluscan-confirm-changelog-empty", text: s.confirm.changelogEmpty });
			}
		}

		const actions = card.createDiv({ cls: "pluscan-confirm-actions" });
		const yes = actions.createEl("button", { text: s.common.install, cls: "mod-cta" });
		yes.addEventListener("click", () => {
			this.close();
			this.onConfirm();
		});
		const no = actions.createEl("button", { text: s.common.cancel });
		no.addEventListener("click", () => this.close());
	}

	private pluginSourcePath(): string {
		return (this.candidate.folderPath ?? "") + "/README.md";
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
