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

// zh-tw.ts — 鍵集須與 en.ts 完全一致（gate 規則 6）。
import type { EnStrings } from "./en";

export const zhTw: EnStrings = {
	settings: {
		header: "從 vault 匯入",
		scanFolder: "掃描文件夾位置",
		scanFolderDesc: "vault 內要掃描插件文件夾或 zip 的文件夾，逗號分隔。",
		autoEnable: "安裝後啟用",
		autoEnableDesc: "安裝完成後立即啟用插件。",
		confirmBeforeInstall: "安裝前確認",
		confirmBeforeInstallDesc: "寫入任何檔案前，先展示插件 manifest 資訊卡並請求確認。",
		backupOnOverwrite: "覆蓋前備份",
		backupOnOverwriteDesc: "覆蓋前把既有版本複製到備份文件夾。",
		backupFolder: "備份文件夾位置",
		language: "語言",
		languageDesc: "默認跟隨 Obsidian 界面語言。",
		donateName: "贊助 Pluscan",
		donateDesc: "Pluscan 是免費開源軟體。如果它對你有幫助，歡迎支持開發者。",
		donateButton: "贊助",
		releaseChannelName: "Release 頻道",
		releaseChannelDesc: "從 GitHub Releases 安裝時使用的頻道。stable 取最新 release；beta 另可貼具體 tag 鏈接（/releases/tag/ 形式）。",
		showChangelogName: "安裝前顯示變更日誌",
		showChangelogDesc: "寫入任何文件前先顯示變更日誌與插件信息卡。after＝安裝後顯示；off＝跳過。",
		showChangelogPriorityName: "變更日誌來源優先級",
		showChangelogPriorityDesc: "優先使用 GitHub release 說明或 CHANGELOG.md 檔案（另一者作為後備）。",
		changelogPriorityNotes: "Release 說明",
		changelogPriorityFile: "CHANGELOG.md 檔案",
		changelogModeBefore: "安裝前",
		changelogModeAfter: "安裝後",
		changelogModeOff: "關閉",
	},
	common: {
		languageAuto: "跟隨 Obsidian",
		scan: "立即掃描",
		install: "安裝",
		cancel: "取消",
		close: "關閉",
	},
	scanner: {
		heading: "vault 內發現的候選",
		empty: "掃描文件夾內沒有插件文件夾或 zip 檔。",
		installed: "已安裝",
		notInstalled: "未安裝",
		versionTo: "版本",
		installAll: "全選",
		installNone: "全不選",
		installSelected: "安裝所選",
		installSelectedCount: (n: number) => `安裝所選 ${n} 項`,
	},
	confirm: {
		heading: "安裝插件",
		pluginId: "插件 id",
		source: "來源",
		minApp: "最低應用版本",
		compatible: "與當前應用版本相容。",
		incompatible: "需要更新的應用版本，強制安裝風險自負。",
		mobileUnsupported: "此插件僅支援桌面版，無法在行動裝置上執行。",
		overwriteWarn: "已存在同 id 版本，覆蓋前會先備份。",
		changelogHeading: "變更日誌",
		changelogEmpty: "此版本未提供變更日誌或 release 說明。",
	},
	urlInstall: {
		settingName: "從 URL 安裝",
		settingDesc: "貼上放有 manifest.json 與 main.js 的目錄地址，或 .zip / .tar.gz 直鏈。取得後自動啟用。",
		placeholder: "https://example.com/myplugin/",
		installButton: "安裝",
		installing: "安裝中…",
		githubName: "從 GitHub Releases 安裝",
		githubDesc: "貼上任意 GitHub 倉庫鏈接（user/repo、/tree/、/releases/tag/…、git@、raw、API repo URL、user/repo 簡寫）。自動取得最新 release 資產安裝；API 鏈接會轉換為倉庫後按一般鏈接解析。",
		githubPlaceholder: "user/repo 或 https://github.com/user/repo",
	},
	notices: {
		scanDone: (n: number) => `Pluscan：找到 ${n} 個候選。`,
		installed: (name: string, version: string) => `已安裝 ${name} ${version}`,
		installFailed: (msg: string) => `安裝失敗：${msg}`,
		enabledFailed: "檔案已寫入，但 Obsidian 無法啟用該插件，請到第三方插件列表查看。",
		mobileUnsupported: "已阻止安裝：此插件僅支援桌面版，不支援行動裝置。",
		selfUpdate: "Pluscan 已更新，重啟 Obsidian 後生效。",
		backedUp: (dir: string) => `舊版本已備份到 ${dir}`,
		busy: "正在安裝另一個，請稍候。",
		invalidManifest: "manifest.json 不是有效的插件清單。",
		missingEntry: "main.js 缺失或為空。",
		appVersion: (v: string) => `該插件需要 Obsidian ${v} 或更高版本。`,
	},
};

export default zhTw;
