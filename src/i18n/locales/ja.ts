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

// ja.ts — 鍵集須與 en.ts 完全一致（gate 規則 6）。
import type { EnStrings } from "./en";

export const ja: EnStrings = {
	settings: {
		header: "vault からインポート",
		scanFolder: "スキャンフォルダ",
		scanFolderDesc: "プラグインフォルダや zip を探す vault 内フォルダ（カンマ区切り）。",
		autoEnable: "インストール後に有効化",
		autoEnableDesc: "インストール完了後すぐにプラグインを有効化します。",
		confirmBeforeInstall: "インストール前に確認",
		confirmBeforeInstallDesc: "ファイル書き込みの前に manifest 情報カードを表示して確認します。",
		backupOnOverwrite: "上書き前にバックアップ",
		backupOnOverwriteDesc: "上書き前に既存バージョンをバックアップフォルダへコピーします。",
		backupFolder: "バックアップフォルダ",
		language: "言語",
		languageDesc: "既定では Obsidian の表示言語に従います。",
		donateName: "Pluscan を支援",
		donateDesc: "Pluscan は無料のオープンソースです。お役に立てたなら、開発者への支援をご検討ください。",
		donateButton: "寄付",
		releaseChannelName: "リリースチャンネル",
		releaseChannelDesc: "GitHub Releases からのインストールに使用するチャンネル。stable は最新リリース、beta は特定タグの URL（/releases/tag/ リンク）も利用できます。",
		showChangelogName: "インストール前に変更履歴を表示",
		showChangelogDesc: "ファイル書き込み前に変更履歴とプラグイン情報カードを表示します。after＝インストール後に表示、off＝スキップ。",
		showChangelogPriorityName: "変更履歴のソース優先度",
		showChangelogPriorityDesc: "GitHub リリースノートと CHANGELOG.md のどちらを優先するか（他方はフォールバック）。",
		changelogPriorityNotes: "リリースノート",
		changelogPriorityFile: "CHANGELOG.md ファイル",
		changelogModeBefore: "インストール前",
		changelogModeAfter: "インストール後",
		changelogModeOff: "オフ",
	},
	common: {
		languageAuto: "Obsidian に従う",
		scan: "今すぐスキャン",
		install: "インストール",
		cancel: "キャンセル",
		close: "閉じる",
	},
	scanner: {
		heading: "vault 内の候補",
		empty: "スキャンフォルダにプラグインフォルダや zip は見つかりませんでした。",
		installed: "インストール済み",
		notInstalled: "未インストール",
		versionTo: "バージョン",
		installAll: "すべて選択",
		installNone: "選択解除",
		installSelected: "選択をインストール",
		installSelectedCount: (n: number) => `選択した ${n} 件をインストール`,
	},
	confirm: {
		heading: "プラグインをインストール",
		pluginId: "プラグイン id",
		source: "ソース",
		minApp: "最小アプリバージョン",
		compatible: "現在のアプリバージョンと互換性があります。",
		incompatible: "より新しいアプリバージョンが必要です。自己責任でインストールしてください。",
		mobileUnsupported: "このプラグインはデスクトップ専用のため、モバイルでは動作しません。",
		overwriteWarn: "同 id の既存バージョンがあり、上書き前にバックアップされます。",
		changelogHeading: "変更履歴",
		changelogEmpty: "このバージョンの変更履歴・リリースノートはありません。",
	},
	urlInstall: {
		settingName: "URL からインストール",
		settingDesc: "manifest.json と main.js を配置したディレクトリ URL、または .zip / .tar.gz の直リンクを貼り付けてください。取得後自動で有効化します。",
		placeholder: "https://example.com/myplugin/",
		installButton: "インストール",
		installing: "インストール中…",
		githubName: "GitHub Releases からインストール",
		githubDesc: "GitHub リポジトリのリンクを貼り付け（user/repo、/tree/、/releases/tag/…、git@、raw、API repo URL、user/repo 短縮形）。最新リリースのアセットを自動取得してインストールします。API リンクはリポジトリに変換され、他のリンクと同様に解決されます。",
		githubPlaceholder: "user/repo または https://github.com/user/repo",
	},
	notices: {
		scanDone: (n: number) => `Pluscan: 候補が ${n} 件見つかりました。`,
		installed: (name: string, version: string) => `${name} ${version} をインストールしました`,
		installFailed: (msg: string) => `インストール失敗: ${msg}`,
		enabledFailed: "ファイルは書き込まれましたが、Obsidian がプラグインを有効化できませんでした。コミュニティプラグイン一覧を確認してください。",
		mobileUnsupported: "インストールをブロックしました：このプラグインはデスクトップ専用で、モバイルに対応していません。",
		selfUpdate: "Pluscan が更新されました。Obsidian を再起動すると反映されます。",
		backedUp: (dir: string) => `旧バージョンを ${dir} にバックアップしました`,
		busy: "別のインストールが実行中です。お待ちください。",
		invalidManifest: "manifest.json は有効なプラグインマニフェストではありません。",
		missingEntry: "main.js がないか空です。",
		appVersion: (v: string) => `このプラグインには Obsidian ${v} 以降が必要です。`,
	},
};

export default ja;
