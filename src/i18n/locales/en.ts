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

// en.ts — 基準鍵集。所有其他語言必須與此鍵集完全一致（scripts/gate.mjs 規則 6）。
export const en = {
	settings: {
		header: "Import from vault",
		scanFolder: "Scan folder location",
		scanFolderDesc: "Folders inside the vault to scan for plugin folders or zip files, comma separated.",
		autoEnable: "Enable after install",
		autoEnableDesc: "Enable the plugin immediately after it is installed.",
		confirmBeforeInstall: "Confirm before install",
		confirmBeforeInstallDesc: "Show a card with the plugin manifest and ask for confirmation before writing any files.",
		backupOnOverwrite: "Back up on overwrite",
		backupOnOverwriteDesc: "Copy the existing plugin version into the backup folder before overwriting it.",
		backupFolder: "Backup folder location",
		language: "Language",
		languageDesc: "Follows the Obsidian interface language by default.",
		donateName: "Donate to Pluscan",
		donateDesc: "Pluscan is free and open source. If it helps you, consider supporting the developer.",
		donateButton: "Donate",
		releaseChannelName: "Release channel",
		releaseChannelDesc: "Channel used when installing from GitHub Releases. Stable uses the latest release; beta also accepts a specific tag URL (paste a /releases/tag/ link).",
		showChangelogName: "Changelog before install",
		showChangelogDesc: "Show the changelog and plugin info card before writing any files. After shows it post-install; off skips it.",
		showChangelogPriorityName: "Changelog source priority",
		showChangelogPriorityDesc: "Prefer the GitHub release notes or the CHANGELOG.md file (the other is used as fallback).",
		changelogPriorityNotes: "Release notes",
		changelogPriorityFile: "CHANGELOG.md file",
		changelogModeBefore: "Before install",
		changelogModeAfter: "After install",
		changelogModeOff: "Off",
	},
	common: {
		languageAuto: "Follow Obsidian",
		scan: "Scan now",
		install: "Install",
		cancel: "Cancel",
		close: "Close",
	},
	scanner: {
		heading: "Candidates found in vault",
		empty: "No plugin folders or zip files found in the scan folders.",
		installed: "installed",
		notInstalled: "not installed",
		versionTo: "version",
		installAll: "Select all",
		installNone: "Select none",
		installSelected: "Install selected",
		installSelectedCount: (n: number) => `Install ${n} selected`,
	},
	confirm: {
		heading: "Install plugin",
		pluginId: "Plugin id",
		source: "Source",
		minApp: "Minimum app version",
		compatible: "Compatible with this app version.",
		incompatible: "Requires a newer app version. Install at your own risk.",
		mobileUnsupported: "This plugin is desktop-only and cannot run on mobile devices.",
		overwriteWarn: "An existing version is present and will be backed up before overwrite.",
		changelogHeading: "Changelog",
		changelogEmpty: "No changelog or release notes provided for this version.",
	},
	urlInstall: {
		settingName: "Install from URL",
		settingDesc: "Paste a directory URL serving manifest.json and main.js, or a .zip / .tar.gz URL. The plugin is fetched and enabled automatically.",
		placeholder: "https://example.com/myplugin/",
		installButton: "Install",
		installing: "Installing…",
		githubName: "Install from GitHub Releases",
		githubDesc: "Paste any GitHub repo link (user/repo, /tree/, /releases/tag/..., git@, raw, API repo URL, user/repo shorthand). The latest release assets are installed automatically; API links are converted to the repo and resolved like any other link.",
		githubPlaceholder: "user/repo or https://github.com/user/repo",
	},
	notices: {
		scanDone: (n: number) => `Pluscan: ${n} candidate(s) found.`,
		installed: (name: string, version: string) => `Installed ${name} ${version}`,
		installFailed: (msg: string) => `Install failed: ${msg}`,
		enabledFailed: "Files were written, but Obsidian could not enable the plugin. Check the community plugins list.",
		mobileUnsupported: "Installation blocked: this plugin is desktop-only and does not support mobile devices.",
		selfUpdate: "Pluscan was updated. Restart Obsidian to finish.",
		backedUp: (dir: string) => `Previous version backed up to ${dir}`,
		busy: "Another install is running, please wait.",
		invalidManifest: "The manifest.json is not a valid plugin manifest.",
		missingEntry: "main.js is missing or empty.",
		appVersion: (v: string) => `This plugin requires Obsidian ${v} or newer.`,
	},
};

export type EnStrings = typeof en;
export default en;
