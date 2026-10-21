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

// de.ts — 鍵集須與 en.ts 完全一致（gate 規則 6）。
import type { EnStrings } from "./en";

export const de: EnStrings = {
	settings: {
		header: "Aus dem Vault importieren",
		scanFolder: "Zu durchsuchende Ordner",
		scanFolderDesc: "Vault-Ordner, in denen nach Plugin-Ordnern oder Zip-Dateien gesucht wird (durch Komma getrennt).",
		autoEnable: "Nach Installation aktivieren",
		autoEnableDesc: "Aktiviert das Plugin sofort nach der Installation.",
		confirmBeforeInstall: "Vor der Installation bestätigen",
		confirmBeforeInstallDesc: "Zeigt vor dem Schreiben von Dateien eine Karte mit dem Plugin-Manifest und fragt nach.",
		backupOnOverwrite: "Vor Überschreiben sichern",
		backupOnOverwriteDesc: "Kopiert die vorhandene Version vor dem Überschreiben in den Sicherungsordner.",
		backupFolder: "Sicherungsordner",
		language: "Sprache",
		languageDesc: "Folgt standardmäßig der Obsidian-Oberflächensprache.",
		releaseChannelName: "Release-Kanal",
		releaseChannelDesc: "Kanal für Installationen aus GitHub Releases. Stable nutzt das neueste Release; Beta akzeptiert auch eine konkrete Tag-URL (/releases/tag/-Link).",
		showChangelogName: "Changelog vor der Installation",
		showChangelogDesc: "Zeigt Changelog und Plugin-Info-Karte, bevor Dateien geschrieben werden. After = nach der Installation; off = überspringen.",
		showChangelogPriorityName: "Quellen-Priorität des Changelogs",
		showChangelogPriorityDesc: "GitHub-Release-Notes oder CHANGELOG.md bevorzugen (das andere dient als Rückfallebene).",
		changelogPriorityNotes: "Release-Notes",
		changelogPriorityFile: "CHANGELOG.md-Datei",
		changelogModeBefore: "Vor der Installation",
		changelogModeAfter: "Nach der Installation",
		changelogModeOff: "Aus",
	},
	common: {
		languageAuto: "Wie Obsidian",
		scan: "Jetzt suchen",
		install: "Installieren",
		cancel: "Abbrechen",
		close: "Schließen",
	},
	scanner: {
		heading: "Kandidaten im Vault gefunden",
		empty: "Keine Plugin-Ordner oder Zip-Dateien in den durchsuchten Ordnern gefunden.",
		installed: "installiert",
		notInstalled: "nicht installiert",
		versionTo: "Version",
		installAll: "Alle auswählen",
		installNone: "Auswahl aufheben",
		installSelected: "Auswahl installieren",
		installSelectedCount: (n: number) => `${n} ausgewählte installieren`,
	},
	confirm: {
		heading: "Plugin installieren",
		pluginId: "Plugin-ID",
		source: "Quelle",
		minApp: "Minimale App-Version",
		compatible: "Kompatibel mit der aktuellen App-Version.",
		incompatible: "Benötigt eine neuere App-Version. Installation auf eigene Gefahr.",
		overwriteWarn: "Eine vorhandene Version ist vorhanden und wird vor dem Überschreiben gesichert.",
		changelogHeading: "Änderungsprotokoll",
		changelogEmpty: "Für diese Version wurde kein Changelog oder keine Release-Notes bereitgestellt.",
	},
	urlInstall: {
		settingName: "Aus URL installieren",
		settingDesc: "URL eines Verzeichnisses mit manifest.json und main.js oder einen direkten .zip / .tar.gz-Link einfügen. Das Plugin wird automatisch aktiviert.",
		placeholder: "https://example.com/myplugin/",
		installButton: "Installieren",
		installing: "Wird installiert…",
		githubName: "Aus GitHub Releases installieren",
		githubDesc: "Beliebigen GitHub-Repository-Link einfügen (user/repo, /tree/, /releases/tag/…, git@, raw, API-Repo-URL, Kurzform user/repo). Die Assets des neuesten Releases werden automatisch installiert; API-Links werden in das Repository umgewandelt und wie andere Links aufgelöst.",
		githubPlaceholder: "user/repo oder https://github.com/user/repo",
	},
	notices: {
		scanDone: (n: number) => `Pluscan: ${n} Kandidat(en) gefunden.`,
		installed: (name: string, version: string) => `${name} ${version} installiert`,
		installFailed: (msg: string) => `Installation fehlgeschlagen: ${msg}`,
		enabledFailed: "Dateien wurden geschrieben, aber Obsidian konnte das Plugin nicht aktivieren. Prüfen Sie die Community-Plugin-Liste.",
		selfUpdate: "Pluscan wurde aktualisiert. Obsidian neu starten, um abzuschließen.",
		backedUp: (dir: string) => `Vorherige Version gesichert in ${dir}`,
		busy: "Eine andere Installation läuft, bitte warten.",
		invalidManifest: "Die manifest.json ist kein gültiges Plugin-Manifest.",
		missingEntry: "main.js fehlt oder ist leer.",
		appVersion: (v: string) => `Dieses Plugin benötigt Obsidian ${v} oder neuer.`,
	},
};

export default de;
