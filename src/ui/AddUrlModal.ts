// pluscan — install modal for URLs and GitHub Releases.
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

// 從 URL / GitHub Releases 安裝對話框（Modal）。US-004＋Releases。
// 用命令入口繞過 1.14 設置頁 ButtonComponent 交互 bug（確認卡/Modal 類交互正常）。
// github=true 時走 installFromGitHubUi（scrubRepositoryUrl 接受任意 GitHub 鏈接格式）。
import { App, Modal, Notice } from "obsidian";
import type { EnStrings } from "../i18n";
import type PluscanPlugin from "../main";

export class AddUrlModal extends Modal {
	constructor(
		app: App,
		private plugin: PluscanPlugin,
		private strings: EnStrings,
		private github = false,
	) {
		super(app);
	}

	onOpen(): void {
		const s = this.strings;
		const name = this.github ? s.urlInstall.githubName : s.urlInstall.settingName;
		const desc = this.github ? s.urlInstall.githubDesc : s.urlInstall.settingDesc;
		const placeholder = this.github ? s.urlInstall.githubPlaceholder : s.urlInstall.placeholder;
		this.contentEl.empty();
		this.contentEl.createEl("h3", { text: name });
		this.contentEl.createDiv({ text: desc, cls: "setting-item-description" });

		const row = this.contentEl.createDiv();
		const textEl = row.createEl("input", { type: "text" });
		textEl.placeholder = placeholder;
		textEl.addClass("pluscan-url-input");

		const submit = (): void => {
			const url = textEl.value;
			if (!url.trim()) return;
			go.textContent = s.urlInstall.installing;
			go.disabled = true;
			const p = this.github ? this.plugin.installFromGitHubUi(url) : this.plugin.installFromUrlUi(url);
			void p.finally(() => {
				go.textContent = s.urlInstall.installButton;
				go.disabled = false;
			});
		};
		textEl.addEventListener("keydown", (ev: KeyboardEvent) => {
			if (ev.key === "Enter") {
				ev.preventDefault();
				submit();
			}
		});

		const actions = this.contentEl.createDiv({ cls: "pluscan-confirm-actions" });
		const go = actions.createEl("button", { text: s.urlInstall.installButton, cls: "mod-cta" });
		go.addEventListener("click", submit);
		const cancel = actions.createEl("button", { text: s.common.cancel });
		cancel.addEventListener("click", () => this.close());
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

export function reportInstallResult(plugin: PluscanPlugin, result: { ok: true; manifest: { id: string; name?: string; version: string }; backedUpTo: string | null } | { ok: false; error: string }, s: EnStrings, badUrlHint?: string): void {
	if (!result.ok) {
		if (result.error === "enable-failed") new Notice(s.notices.enabledFailed);
		else if (result.error === "empty-main") new Notice(s.notices.missingEntry);
		else if (result.error === "bad-url") new Notice(s.notices.installFailed(badUrlHint ?? s.urlInstall.settingDesc));
		else new Notice(s.notices.installFailed(result.error));
		return;
	}
	if (result.manifest.id === "pluscan") {
		new Notice(s.notices.selfUpdate, 8000);
		return;
	}
	new Notice(s.notices.installed(result.manifest.name ?? result.manifest.id, result.manifest.version));
	if (result.backedUpTo) new Notice(s.notices.backedUp(result.backedUpTo));
	void plugin;
}
