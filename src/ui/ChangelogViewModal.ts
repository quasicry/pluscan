// pluscan — post-install changelog viewer (after mode).
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

// after 模式：安裝完成後彈出 changelog 檢視（Markdown 渲染； displayChangelog 語義）。
import { App, MarkdownRenderer, Modal, type Component } from "obsidian";
import type { EnStrings } from "../i18n";
import type PluscanPlugin from "../main";

export class ChangelogViewModal extends Modal {
	constructor(
		app: App,
		private repo: string,
		private tag: string,
		private changelog: string | null,
		private strings: EnStrings,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		const s = this.strings;
		contentEl.empty();
		contentEl.createEl("h3", { text: s.settings.showChangelogName });
		contentEl.createDiv({ text: this.repo + " @ " + this.tag, cls: "setting-item-description" });
		const body = contentEl.createDiv({ cls: "pluscan-confirm-changelog-body" });
		const host = (this.app as unknown as { plugins: { plugins: Record<string, PluscanPlugin & Component> } }).plugins.plugins["pluscan"];
		if (this.changelog) {
			void MarkdownRenderer.render(this.app, this.changelog, body, "", host);
		} else {
			body.createDiv({ text: s.confirm.changelogEmpty });
		}
		const actions = contentEl.createDiv({ cls: "pluscan-confirm-actions" });
		const close = actions.createEl("button", { text: s.common.close });
		close.addEventListener("click", () => this.close());
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
