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

// fr.ts — 鍵集須與 en.ts 完全一致（gate 規則 6）。
import type { EnStrings } from "./en";

export const fr: EnStrings = {
	settings: {
		header: "Importer depuis le coffre",
		scanFolder: "Dossiers à analyser",
		scanFolderDesc: "Dossiers du coffre où chercher des dossiers de plugins ou des fichiers zip, séparés par des virgules.",
		autoEnable: "Activer après l'installation",
		autoEnableDesc: "Active le plugin immédiatement après son installation.",
		confirmBeforeInstall: "Confirmer avant l'installation",
		confirmBeforeInstallDesc: "Affiche une fiche avec le manifest du plugin et demande confirmation avant d'écrire des fichiers.",
		backupOnOverwrite: "Sauvegarder avant écrasement",
		backupOnOverwriteDesc: "Copie la version existante dans le dossier de sauvegarde avant de l'écraser.",
		backupFolder: "Dossier de sauvegarde",
		language: "Langue",
		languageDesc: "Suit la langue de l'interface Obsidian par défaut.",
		donateName: "Soutenir Pluscan",
		donateDesc: "Pluscan est gratuit et open source. S’il vous est utile, pensez à soutenir le développeur.",
		donateButton: "Faire un don",
		releaseChannelName: "Canal de release",
		releaseChannelDesc: "Canal utilisé pour l'installation depuis GitHub Releases. Stable prend la dernière release ; beta accepte aussi une URL de tag précise (lien /releases/tag/).",
		showChangelogName: "Changelog avant installation",
		showChangelogDesc: "Affiche le changelog et la fiche du plugin avant d'écrire des fichiers. After = après l'installation ; off = ignorer.",
		showChangelogPriorityName: "Priorité de la source du changelog",
		showChangelogPriorityDesc: "Préférer les notes de release GitHub ou le fichier CHANGELOG.md (l'autre sert de repli).",
		changelogPriorityNotes: "Notes de release",
		changelogPriorityFile: "Fichier CHANGELOG.md",
		changelogModeBefore: "Avant installation",
		changelogModeAfter: "Après installation",
		changelogModeOff: "Désactivé",
	},
	common: {
		languageAuto: "Suivre Obsidian",
		scan: "Analyser maintenant",
		install: "Installer",
		cancel: "Annuler",
		close: "Fermer",
	},
	scanner: {
		heading: "Candidats trouvés dans le coffre",
		empty: "Aucun dossier de plugin ni fichier zip trouvé dans les dossiers analysés.",
		installed: "installé",
		notInstalled: "non installé",
		versionTo: "version",
		installAll: "Tout sélectionner",
		installNone: "Tout désélectionner",
		installSelected: "Installer la sélection",
		installSelectedCount: (n: number) => `Installer ${n} élément(s) sélectionné(s)`,
	},
	confirm: {
		heading: "Installer le plugin",
		pluginId: "Id du plugin",
		source: "Source",
		minApp: "Version minimale de l'application",
		compatible: "Compatible avec la version actuelle de l'application.",
		incompatible: "Nécessite une version plus récente. Installez à vos propres risques.",
		mobileUnsupported: "Ce plugin est réservé au bureau et ne peut pas fonctionner sur mobile.",
		overwriteWarn: "Une version existante est présente et sera sauvegardée avant écrasement.",
		changelogHeading: "Journal des modifications",
		changelogEmpty: "Aucun changelog ni note de release fournie pour cette version.",
	},
	urlInstall: {
		settingName: "Installer depuis une URL",
		settingDesc: "Collez l'URL d'un répertoire contenant manifest.json et main.js, ou un lien direct .zip / .tar.gz. Le plugin est activé automatiquement.",
		placeholder: "https://example.com/myplugin/",
		installButton: "Installer",
		installing: "Installation…",
		githubName: "Installer depuis GitHub Releases",
		githubDesc: "Collez n'importe quel lien de dépôt GitHub (user/repo, /tree/, /releases/tag/…, git@, raw, URL d'API du dépôt, forme courte user/repo). Les ressources de la dernière release sont installées automatiquement ; les liens d'API sont convertis en dépôt puis résolus comme les autres.",
		githubPlaceholder: "user/repo ou https://github.com/user/repo",
	},
	notices: {
		scanDone: (n: number) => `Pluscan : ${n} candidat(s) trouvé(s).`,
		installed: (name: string, version: string) => `${name} ${version} installé`,
		installFailed: (msg: string) => `Échec de l'installation : ${msg}`,
		enabledFailed: "Les fichiers ont été écrits, mais Obsidian n'a pas pu activer le plugin. Vérifiez la liste des plugins communautaires.",
		mobileUnsupported: "Installation bloquée : ce plugin est réservé au bureau et ne prend pas en charge les appareils mobiles.",
		selfUpdate: "Pluscan a été mis à jour. Redémarrez Obsidian pour terminer.",
		backedUp: (dir: string) => `Ancienne version sauvegardée dans ${dir}`,
		busy: "Une autre installation est en cours, veuillez patienter.",
		invalidManifest: "Le manifest.json n'est pas un manifest de plugin valide.",
		missingEntry: "main.js est absent ou vide.",
		appVersion: (v: string) => `Ce plugin nécessite Obsidian ${v} ou plus récent.`,
	},
};

export default fr;
