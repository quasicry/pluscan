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

// 設置 schema 與默認值（新設置項一律默認開，PRD 慣例；語言默認跟隨系統＝空串）。
export interface PluscanSettings {
	/** vault 內掃描文件夾，相對 vault 根，逗號分隔 */
	scanFolders: string;
	autoEnable: boolean;
	confirmBeforeInstall: boolean;
	backupOnOverwrite: boolean;
	backupFolder: string;
	/** 空 = 跟隨 Obsidian 界面語言 */
	language: string;
	/** GitHub Releases 頻道（全局默認）：stable=latest、beta=可貼具體 tag 鏈接 */
	releaseChannel: ReleaseChannel;
	/** 按插件覆蓋頻道：plugin id → channel */
	releaseChannels: Record<string, ReleaseChannel>;
	/** 變更日誌預檢（默認 before＋release_notes）：確認前不寫任何文件 */
	showChangelog: ShowChangelogConfig;
}

export const DEFAULT_SETTINGS: PluscanSettings = {
	scanFolders: "_plugins",
	autoEnable: true,
	confirmBeforeInstall: true,
	backupOnOverwrite: true,
	backupFolder: "_plugins/backup",
	language: "",
	releaseChannel: "beta",
	releaseChannels: {},
	showChangelog: { mode: "before", priority: "release_notes" },
};

export type ReleaseChannel = "stable" | "beta";
export type ChangelogPriority = "release_notes" | "changelog_file";
export type ChangelogMode = "before" | "after" | "off";

export interface ShowChangelogConfig {
	mode: ChangelogMode;
	priority: ChangelogPriority;
}

/** manifest.json 白名單校驗：id 字符集（gate 同款，禁 lookbehind 寫法）。 */
export const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
