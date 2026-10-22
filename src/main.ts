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

// main.ts —— pluscan 入口：掃描命令＋設置頁＋i18n。US-001/002 接線。
import { addIcon, Notice, Plugin, normalizePath } from "obsidian";
import { DEFAULT_SETTINGS, type PluscanSettings } from "./settings";
import { getStrings, type EnStrings } from "./i18n";
import { scanVaultFolders, type Candidate } from "./scanner/scanner";
import { scanVaultZips, parseZipManifest, type ZipCandidate } from "./installer/zip";
import { installFromFolder, installFromZip } from "./installer/installer";
import { ConfirmModal } from "./ui/ConfirmModal";
import { AddUrlModal, reportInstallResult } from "./ui/AddUrlModal";
import { CandidateListModal, buildListEntries, type ListEntry } from "./ui/CandidateListModal";
import { ChangelogViewModal } from "./ui/ChangelogViewModal";
import { PluscanSettingTab } from "./ui/SettingTab";
import { resolveRemoteUrl, commitRemote, type ResolvedRemote } from "./installer/remote";
import { resolveGitHubRelease, type ReleaseChannel } from "./installer/releases";
import { fetchChangelog } from "./installer/changelog";

/** 品牌 ribbon 圖示：悉曇文字 𑖂（U+11582，Noto Sans Siddham 輪廓，OFL-1.1）。 */
const PLUSCAN_ICON_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path d=\"M243 364Q208 364 172.5 379.0Q137 394 108.0 419.5Q79 445 61.5 477.5Q44 510 44 546Q44 580 61.0 610.5Q78 641 109.0 660.5Q140 680 181 680Q216 680 251.0 665.0Q286 650 315.0 624.5Q344 599 361.5 566.5Q379 534 379 499Q379 465 362.0 434.0Q345 403 314.5 383.5Q284 364 243 364ZM643 364Q608 364 572.5 379.0Q537 394 508.0 419.5Q479 445 461.5 477.5Q444 510 444 546Q444 580 461.0 610.5Q478 641 509.0 660.5Q540 680 581 680Q616 680 651.0 665.0Q686 650 715.0 624.5Q744 599 761.5 566.5Q779 534 779 499Q779 465 762.0 434.0Q745 403 714.5 383.5Q684 364 643 364ZM180 428Q208 428 233.5 448.5Q259 469 276.0 500.0Q293 531 293 561Q293 590 278.5 603.0Q264 616 244 616Q217 616 191.0 595.5Q165 575 148.0 544.5Q131 514 131 483Q131 455 145.5 441.5Q160 428 180 428ZM580 428Q608 428 633.5 448.5Q659 469 676.0 500.0Q693 531 693 561Q693 590 678.5 603.0Q664 616 644 616Q617 616 591.0 595.5Q565 575 548.0 544.5Q531 514 531 483Q531 455 545.5 441.5Q560 428 580 428ZM456 -54Q346 -54 256.5 27.0Q167 108 90 251L118 267Q193 149 264.0 91.0Q335 33 419 33Q466 33 499.5 52.0Q533 71 550.5 102.5Q568 134 568 171Q568 227 535.5 255.5Q503 284 459 284Q421 284 394.5 258.5Q368 233 368 195Q368 177 375.0 161.0Q382 145 392 131L379 115Q330 145 302.5 177.5Q275 210 275 249Q275 293 309.5 323.0Q344 353 401 353Q442 353 481.5 337.0Q521 321 564 289Q616 252 639.0 211.5Q662 171 662 123Q662 74 638.5 34.0Q615 -6 569.0 -30.0Q523 -54 456 -54Z\" fill=\"currentColor\" transform=\"translate(14.1687,77.2544) scale(0.087075,-0.087075)\"/></svg>";

export default class PluscanPlugin extends Plugin {
	settings: PluscanSettings = DEFAULT_SETTINGS;
	strings: EnStrings = getStrings("");
	private busy = false;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.strings = getStrings(this.settings.language);

		// 啟動即確保掃描根目錄與備份目錄存在（首次安裝即可拖文件進來）
		await this.ensureWorkingFolders();

		this.addCommand({
			id: "scan-vault-plugins",
			name: this.strings.common.scan,
			callback: () => this.runScan(true),
		});

		// US-004：命令入口（1.14 設置頁按鈕交互 bug 的繞行路徑）
		this.addCommand({
			id: "install-from-url",
			name: this.strings.urlInstall.settingName,
			callback: () => new AddUrlModal(this.app, this, this.strings).open(),
		});

		// GitHub Releases 命令入口（與 install-from-url 同款繞行路徑）
		this.addCommand({
			id: "install-from-github",
			name: this.strings.urlInstall.githubName,
			callback: () => new AddUrlModal(this.app, this, this.strings, true).open(),
		});

		addIcon("pluscan", PLUSCAN_ICON_SVG);
		this.addRibbonIcon("pluscan", "Pluscan", () => this.runScan(true));

		this.app.workspace.onLayoutReady(() => {
			this.settingTab = new PluscanSettingTab(this.app, this);
			this.addSettingTab(this.settingTab);
		});
	}

	refreshLocale(): void {
		this.strings = getStrings(this.settings.language);
		// 聲明式設置頁以新語言重繪（update 重新求值 getSettingDefinitions）
		if (this.settingTab) this.settingTab.update();
	}

	private settingTab: PluscanSettingTab | null = null;

	/** 建立 scanFolders 根目錄與 backupFolder（已存在則跳過）。 */
	private async ensureWorkingFolders(): Promise<void> {
		const adapter = this.app.vault.adapter;
		const normalize = (p: string): string => normalizePath(p);
		const scanRoot = normalize(this.settings.scanFolders);
		const backup = normalize(this.settings.backupFolder);
		for (const dir of [scanRoot, backup]) {
			if (dir && !(await adapter.exists(dir))) {
				try {
					await adapter.mkdir(dir);
				} catch {
					// 建立失敗不阻塞啟動（如只讀 vault）
				}
			}
		}
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<PluscanSettings>);
	}

	// US-004：Modal/命令共用的 URL 安裝入口（統一錯誤處理）
	/** GitHub Releases 安裝入口（Modal/命令共用）。channel：全局默認，或按插件覆蓋（安裝後記錄）。 */
	/**
	 * 變更日誌預檢工作流（零 API）：
	 * fetch（不寫盤）→ before＝確認卡含 changelog（確認前不寫任何文件）→ commit → after＝changelog 檢視。
	 */
	private async reviewAndCommit(source: string, resolved: ResolvedRemote, opts: { repo?: string; tag?: string | null; badUrlHint?: string; onInstalled?: (id: string) => void }): Promise<void> {
		const s = this.strings;
		const cfg = this.settings.showChangelog;
		const plugins = (this.app as unknown as { plugins: { plugins: Record<string, unknown> } }).plugins;
		const overwrite = resolved.manifest.id !== "pluscan" && !!plugins.plugins[resolved.manifest.id];

		let changelog: string | null = null;
		const wantChangelog = cfg.mode !== "off" && !!opts.repo && !!opts.tag;
		if (wantChangelog && opts.repo && opts.tag) {
			const cl = await fetchChangelog({ repo: opts.repo, tag: opts.tag, priority: cfg.priority });
			if (cl !== null) changelog = cl;
			else if (cfg.mode === "before") changelog = ""; // 顯示「無 changelog」行
		}

		const doCommit = async (): Promise<void> => {
			const result = await commitRemote(this.app, resolved, source, {
				confirmBeforeInstall: this.settings.confirmBeforeInstall,
				autoEnable: this.settings.autoEnable,
				backupOnOverwrite: this.settings.backupOnOverwrite,
				backupFolder: this.settings.backupFolder,
			});
			reportInstallResult(this, result, s, opts.badUrlHint);
			if (result.ok) {
				opts.onInstalled?.(result.manifest.id);
				// after 模式：裝完彈 changelog 檢視（僅 Releases 來源有 repo/tag）
				if (cfg.mode === "after" && opts.repo && opts.tag) {
					const cl = changelog ?? await fetchChangelog({ repo: opts.repo, tag: opts.tag, priority: cfg.priority });
					new ChangelogViewModal(this.app, opts.repo, opts.tag, cl, s).open();
				}
			}
		};

		if (cfg.mode === "before") {
			new ConfirmModal(this.app, { folderPath: source, manifest: resolved.manifest, error: null }, s, overwrite, () => void doCommit(), changelog, this).open();
		} else {
			await doCommit();
		}
	}

	async installFromGitHubUi(input: string, channelOverride?: ReleaseChannel): Promise<void> {
		if (this.busy) {
			new Notice(this.strings.notices.busy);
			return;
		}
		this.busy = true;
		try {
			const channel = channelOverride ?? this.settings.releaseChannels[input] ?? this.settings.releaseChannel;
			const resolved = await resolveGitHubRelease(input, channel);
			if (!resolved.ok) {
				reportInstallResult(this, resolved, this.strings, this.strings.urlInstall.githubDesc);
				return;
			}
			const value = resolved.value;
			await this.reviewAndCommit(input, value.resolved, {
				repo: value.repo,
				tag: value.tag,
				badUrlHint: this.strings.urlInstall.githubDesc,
				onInstalled: (id) => {
					this.settings.releaseChannels[input] = channel;
					void this.saveSettings();
				},
			});
		} catch (e) {
			new Notice(this.strings.notices.installFailed(String(e)), 8000);
		} finally {
			this.busy = false;
		}
	}

	async installFromUrlUi(url: string): Promise<void> {
		if (this.busy) {
			new Notice(this.strings.notices.busy);
			return;
		}
		this.busy = true;
		try {
			const resolved = await resolveRemoteUrl(url);
			if (!resolved.ok) {
				reportInstallResult(this, resolved, this.strings);
				return;
			}
			await this.reviewAndCommit(url, resolved.value, {});
		} catch (e) {
			new Notice(this.strings.notices.installFailed(String(e)), 8000);
		} finally {
			this.busy = false;
		}
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	/** US-001/003：掃描並列出候選（裸目錄＋zip）；列表 UI 勾選批量安裝；單候選走原有單卡流程。 */
	private async runScan(showNotices: boolean): Promise<void> {
		if (this.busy) {
			new Notice(this.strings.notices.busy);
			return;
		}
		const candidates = await scanVaultFolders(this.app.vault, this.settings.scanFolders);
		const zips = await scanVaultZips(this.app.vault, this.settings.scanFolders);
		const total = candidates.length + zips.length;
		if (showNotices) new Notice(this.strings.notices.scanDone(total));
		if (total === 0) return;

		if (total === 1 && !this.settings.confirmBeforeInstall) {
			// 單候選＋無確認＝零摩擦直接裝（原有路徑）
			if (candidates.length === 1) await this.offerInstall(candidates[0]);
			else await this.offerZipInstall(zips[0]);
			return;
		}

		// 列表 UI：一次列出全部候選、勾選批量安裝
		const installedIds = new Set(
			Object.keys((this.app as unknown as { plugins: { plugins: Record<string, unknown> } }).plugins.plugins),
		);
		const entries = buildListEntries(candidates, zips, installedIds, this.strings);
		new CandidateListModal(this.app, entries, this.strings, (selected) => this.installSelected(selected)).open();
	}

	/** 列表勾選後的批量安裝：逐個寫盤（各自 try/catch，單個失敗不中斷其餘）。 */
	private async installSelected(selected: ListEntry[]): Promise<void> {
		this.busy = true;
		const s = this.strings;
		try {
			for (const entry of selected) {
				try {
					if (entry.kind === "folder" && entry.folder) {
						const result = await installFromFolder(this.app, entry.folder, {
							confirmBeforeInstall: false,
							autoEnable: this.settings.autoEnable,
							backupOnOverwrite: this.settings.backupOnOverwrite,
							backupFolder: this.settings.backupFolder,
						});
						this.reportBatchResult(entry, result, s);
					} else if (entry.kind === "zip" && entry.zip) {
						const bytes = new Uint8Array(await this.app.vault.adapter.readBinary(entry.zip.zipPath));
						const parsed = parseZipManifest(bytes);
						if (!("manifest" in parsed)) {
							new Notice(s.notices.installFailed(entry.zip.zipPath + ": " + s.notices.invalidManifest));
							continue;
						}
						const result = await installFromZip(this.app, { ...entry.zip, manifest: parsed.manifest }, parsed.files, {
							confirmBeforeInstall: false,
							autoEnable: this.settings.autoEnable,
							backupOnOverwrite: this.settings.backupOnOverwrite,
							backupFolder: this.settings.backupFolder,
						});
						this.reportBatchResult(entry, result, s);
					}
				} catch (e) {
					new Notice(s.notices.installFailed(`${entry.name}: ${String(e)}`), 8000);
				}
			}
		} finally {
			this.busy = false;
		}
	}

	private reportBatchResult(entry: ListEntry, result: { ok: boolean; error?: string; manifest?: { id: string; name?: string; version: string }; backedUpTo?: string | null }, s: EnStrings): void {
		if (!result.ok) {
			const err = result.error ?? "";
			if (err.startsWith("minapp:")) new Notice(s.notices.appVersion(err.slice(7)));
			else if (err === "mobile-unsupported") new Notice(s.notices.mobileUnsupported);
			else if (err === "enable-failed") new Notice(s.notices.enabledFailed);
			else if (err === "empty-main") new Notice(s.notices.missingEntry);
			else new Notice(s.notices.installFailed(`${entry.name}: ${err}`), 8000);
			return;
		}
		if (result.manifest?.id === "pluscan") {
			new Notice(s.notices.selfUpdate, 8000);
			return;
		}
		new Notice(s.notices.installed(result.manifest?.name ?? result.manifest?.id ?? entry.id, result.manifest?.version ?? ""));
		if (result.backedUpTo) new Notice(s.notices.backedUp(result.backedUpTo));
	}

	private async offerZipInstall(zip: ZipCandidate): Promise<void> {
		const s = this.strings;
		if (!zip.manifest) {
			new Notice(s.notices.installFailed(zip.zipPath + ": " + s.notices.invalidManifest));
			return;
		}
		const id = zip.manifest.id;
		const plugins = (this.app as unknown as { plugins: { plugins: Record<string, unknown> } }).plugins;
		const overwrite = id !== "pluscan" && !!plugins.plugins[id];
		// 解壓一次，確認卡展示與安裝共用同一映射
		const bytes = new Uint8Array(await this.app.vault.adapter.readBinary(zip.zipPath));
		const parsed = parseZipManifest(bytes);
		if (!("manifest" in parsed)) {
			new Notice(s.notices.installFailed(zip.zipPath + ": " + s.notices.invalidManifest));
			return;
		}

		const doInstall = async (): Promise<void> => {
			this.busy = true;
			try {
				const result = await installFromZip(this.app, { ...zip, manifest: parsed.manifest }, parsed.files, {
					confirmBeforeInstall: this.settings.confirmBeforeInstall,
					autoEnable: this.settings.autoEnable,
					backupOnOverwrite: this.settings.backupOnOverwrite,
					backupFolder: this.settings.backupFolder,
				});
				if (!result.ok) {
					if (result.error.startsWith("minapp:")) {
						new Notice(s.notices.appVersion(result.error.slice(7)));
					} else if (result.error === "mobile-unsupported") {
					new Notice(s.notices.mobileUnsupported);} else if (result.error === "enable-failed") {
						new Notice(s.notices.enabledFailed);
					} else if (result.error === "empty-main") {
						new Notice(s.notices.missingEntry);
					} else {
						new Notice(s.notices.installFailed(result.error));
					}
					return;
				}
				if (result.manifest.id === "pluscan") {
					new Notice(s.notices.selfUpdate, 8000);
					return;
				}
				new Notice(s.notices.installed(result.manifest.name ?? result.manifest.id, result.manifest.version));
				if (result.backedUpTo) new Notice(s.notices.backedUp(result.backedUpTo));
			} finally {
				this.busy = false;
			}
		};

		if (this.settings.confirmBeforeInstall) {
			new ConfirmModal(this.app, { folderPath: zip.zipPath, manifest: parsed.manifest, error: null }, s, overwrite, () => void doInstall(), null, this).open();
		} else {
			await doInstall();
		}
	}

	private async offerInstall(candidate: Candidate): Promise<void> {
		const s = this.strings;
		if (!candidate.manifest) {
			new Notice(s.notices.installFailed(candidate.folderPath + ": " + s.notices.invalidManifest));
			return;
		}
		const id = candidate.manifest.id;
		const plugins = (this.app as unknown as { plugins: { plugins: Record<string, unknown> } }).plugins;
		const overwrite = id !== "pluscan" && !!plugins.plugins[id];
		const selfPath = normalizePath(this.app.vault.configDir + "/plugins/" + id);
		const isSelfDir = normalizePath(candidate.folderPath) === selfPath;

		const doInstall = async (): Promise<void> => {
			this.busy = true;
			try {
				const result = await installFromFolder(this.app, candidate, {
					confirmBeforeInstall: this.settings.confirmBeforeInstall,
					autoEnable: this.settings.autoEnable,
					backupOnOverwrite: this.settings.backupOnOverwrite,
					backupFolder: this.settings.backupFolder,
				});
				if (!result.ok) {
					if (result.error.startsWith("minapp:")) {
						new Notice(s.notices.appVersion(result.error.slice(7)));
					} else if (result.error === "mobile-unsupported") {
					new Notice(s.notices.mobileUnsupported);} else if (result.error === "enable-failed") {
						new Notice(s.notices.enabledFailed);
					} else if (result.error === "empty-main") {
						new Notice(s.notices.missingEntry);
					} else {
						new Notice(s.notices.installFailed(result.error));
					}
					return;
				}
				if (result.manifest.id === "pluscan") {
					new Notice(s.notices.selfUpdate, 8000);
					return;
				}
				new Notice(s.notices.installed(result.manifest.name ?? result.manifest.id, result.manifest.version));
				if (result.backedUpTo) new Notice(s.notices.backedUp(result.backedUpTo));
			} finally {
				this.busy = false;
			}
		};

		if (this.settings.confirmBeforeInstall && !isSelfDir) {
			new ConfirmModal(this.app, candidate, s, overwrite, () => void doInstall(), null, this).open();
		} else {
			await doInstall();
		}
	}
}
