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

// 設置頁。1.13+ 聲明式設置 API（getSettingDefinitions，可被官方設置搜索索引）；minAppVersion 1.13.0。
// 規範：無頂層標題、標題不含 settings 字樣、setHeading、Sentence case。
import { App, ButtonComponent, PluginSettingTab, Setting, TextComponent, type SettingDefinitionItem } from "obsidian";
import type PluscanPlugin from "../main";
import { LANGUAGE_OPTIONS } from "../i18n";

export class PluscanSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private plugin: PluscanPlugin,
	) {
		super(app, plugin);
	}

	getControlValue(key: string): unknown {
		const nested = key.indexOf(".");
		if (nested > 0) {
			const obj = (this.plugin.settings as unknown as Record<string, Record<string, unknown>>)[key.slice(0, nested)];
			return obj?.[key.slice(nested + 1)];
		}
		return (this.plugin.settings as unknown as Record<string, unknown>)[key];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		const nested = key.indexOf(".");
		if (nested > 0) {
			const head = key.slice(0, nested);
			const obj = (this.plugin.settings as unknown as Record<string, Record<string, unknown>>)[head];
			if (obj) obj[key.slice(nested + 1)] = value;
		} else {
			(this.plugin.settings as unknown as Record<string, unknown>)[key] = value;
		}
		await this.plugin.saveSettings();
		// 語言切換即時生效：重載 strings＋聲明式設置頁以新語言重繪
		if (key === "language") this.plugin.refreshLocale();
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const s = this.plugin.strings;

		// US-004：從 URL 安裝（裸目錄三件套或 .zip / .tar.gz 直鏈）。
		// text+button 組合用 render 自由佈局；交互統一走 installFromUrlUi（含錯誤處理）。
		// 1.14 桌面設置彈窗按鈕 bug 時以命令入口為替代。
		const urlInstallDef: SettingDefinitionItem = {
			name: s.urlInstall.settingName,
			desc: s.urlInstall.settingDesc,
			render: (setting: Setting): void | (() => void) => {
				setting.settingEl.addClass("pluscan-url-setting");
				let urlInput: TextComponent | null = null;
				setting
					.addText((t: TextComponent) => {
						urlInput = t;
						t.setPlaceholder(s.urlInstall.placeholder);
						t.inputEl.addClass("pluscan-url-input");
					})
					.addButton((b: ButtonComponent) =>
						b.setButtonText(s.urlInstall.installButton).setCta().onClick(async () => {
							const url = urlInput ? urlInput.getValue() : "";
							if (!url.trim()) return;
							await this.plugin.installFromUrlUi(url);
						}),
					);
			},
		};

		// GitHub Releases 安裝行（render：input+button；走 installFromGitHubUi）
		const ghReleaseDef: SettingDefinitionItem = {
			name: s.urlInstall.githubName,
			desc: s.urlInstall.githubDesc,
			render: (setting: Setting): void | (() => void) => {
				setting.settingEl.addClass("pluscan-url-setting");
				let ghInput: TextComponent | null = null;
				setting
					.addText((t: TextComponent) => {
						ghInput = t;
						t.setPlaceholder(s.urlInstall.githubPlaceholder);
						t.inputEl.addClass("pluscan-url-input");
					})
					.addButton((b: ButtonComponent) =>
						b.setButtonText(s.urlInstall.installButton).setCta().onClick(async () => {
							const input = ghInput ? ghInput.getValue() : "";
							if (!input.trim()) return;
							await this.plugin.installFromGitHubUi(input);
						}),
					);
			},
		};

		// 捐贈：外鏈按鈕（render 型，無持久化設置）
		const donateDef: SettingDefinitionItem = {
			name: s.settings.donateName,
			desc: s.settings.donateDesc,
			render: (setting: Setting): void | (() => void) => {
				setting.settingEl.addClass("pluscan-donate-setting");
				setting.addButton((b: ButtonComponent) =>
					b.setButtonText(s.settings.donateButton).onClick(() => {
						window.open("https://buymeacoffee.com/quasicry", "_blank");
					}),
				);
			},
		};

		return [
			{
				name: s.settings.scanFolder,
				desc: s.settings.scanFolderDesc,
				control: { type: "text", key: "scanFolders" },
			},
			{
				name: s.settings.autoEnable,
				desc: s.settings.autoEnableDesc,
				control: { type: "toggle", key: "autoEnable" },
			},
			{
				name: s.settings.confirmBeforeInstall,
				desc: s.settings.confirmBeforeInstallDesc,
				control: { type: "toggle", key: "confirmBeforeInstall" },
			},
			{
				name: s.settings.backupOnOverwrite,
				desc: s.settings.backupOnOverwriteDesc,
				control: { type: "toggle", key: "backupOnOverwrite" },
			},
			{
				name: s.settings.backupFolder,
				control: { type: "text", key: "backupFolder" },
			},
			urlInstallDef,
			ghReleaseDef,
			{
				name: s.settings.showChangelogName,
				desc: s.settings.showChangelogDesc,
				control: {
					type: "dropdown",
					key: "showChangelog.mode",
					options: {
						before: s.settings.changelogModeBefore,
						after: s.settings.changelogModeAfter,
						off: s.settings.changelogModeOff,
					},
				},
			},
			{
				name: s.settings.showChangelogPriorityName,
				desc: s.settings.showChangelogPriorityDesc,
				control: {
					type: "dropdown",
					key: "showChangelog.priority",
					options: {
						release_notes: s.settings.changelogPriorityNotes,
						changelog_file: s.settings.changelogPriorityFile,
					},
				},
			},
			{
				name: s.settings.releaseChannelName,
				desc: s.settings.releaseChannelDesc,
				control: {
					type: "dropdown",
					key: "releaseChannel",
					options: { beta: "beta", stable: "stable" },
				},
			},
			{
				name: s.settings.language,
				desc: s.settings.languageDesc,
				control: {
					type: "dropdown",
					key: "language",
					options: (() => {
						const opts: Record<string, string> = {};
						for (const opt of LANGUAGE_OPTIONS) {
							opts[opt.value] = opt.value === "" ? s.common.languageAuto : opt.label;
						}
						return opts;
					})(),
				},
			},
			donateDef,
		];
	}
}
