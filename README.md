# Pluscan

𑖂

Install Obsidian plugins from **local folders or zip files inside your vault** 

Place a plugin folder (containing `manifest.json` and `main.js`) into `_plugins/`
(or any folder you configure), then run **Pluscan: Scan now** or tap the ribbon
icon. Pluscan lists every candidate in one dialog — tick the ones you want and
install them in a single batch. Before an install you can review the manifest,
compatibility info and the changelog; nothing is written until you confirm.

Works on mobile: get files into the vault with iCloud or any file manager — Pluscan does the rest with the official vault adapter APIs.

## Features

- Scan configured vault folders for plugin folders (bare directories) and zip/tar/tar.gz archives; candidates are shown in a list dialog with select-all / batch install (broken candidates are disabled with the reason shown).
- Install from remote URLs: a bare directory serving `manifest.json` (+ `main.js`, optional `styles.css` and `icon.svg`) or a direct link to a `.zip`, `.tar`, `.tar.gz` or `.tgz` archive. The `icon.svg` is carried over too; a new version without one removes the stale icon.
- Install from GitHub Releases: paste any repo link (user/repo, /tree/, /releases/tag/, git@, raw, API, shorthand) — the latest release assets are resolved automatically; both archive assets (`.zip`, `.tar`, `.tar.gz`, `.tgz`) and bare main.js/manifest.json/styles.css assets are supported.
- Changelog review before install (also for URL and Releases installs): show the release notes or CHANGELOG.md on a confirm card, after install, or off; priority between the two sources is configurable. Nothing is written before you confirm.
- Release channel setting (`releaseChannel`, global default: beta, per-plugin override): stable = latest release; pre-releases are installed by pasting a specific `/releases/tag/` link.
- Confirm-before-install card: id, version, minimum app version, compatibility.
- Atomic install via temp directory; backup of the previous version on overwrite (if the backup fails, the install aborts rather than overwriting without protection). Self-updates never delete the running plugin directory.
- The scan folder and backup folder are created automatically on startup.
- Install dialogs support Enter to submit.
- Enable after install (optional); failure notices are shown as-is.
- Five UI languages: 繁體中文, 日本語, English, Français, Deutsch.
- No GitHub API dependency — fully usable offline.

## Install

Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/quasicry/pluscan/releases/latest) into `.obsidian/plugins/pluscan/`, or install them directly from within Obsidian by pasting the repository URL into Pluscan itself.

## Author

[quasicry](https://github.com/quasicry)

## License

AGPL-3.0-or-later. This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. See [LICENSE](LICENSE).
