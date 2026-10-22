# Changelog

本文件記錄 pluscan 每次可交付變更。格式遵循 Keep a Changelog；版本遵 SemVer。
「落地記錄」見 `LOG.md`（含每次變更的驗證證據）。


## 0.2.0

_2026-10-20_

### Fixed
- 修復窄窗口下 URL/GitHub Releases 輸入框連同安裝按鈕溢出設置頁：放寬輸入框最小寬度並按窗口寬度分級回退。
- 修復輸入框加寬後長語言（英/日/法/德）設置項名稱被擠壓折行的回歸：info 區保留最小可讀寬度，輸入框仍佔過半。
- 設置頁「覆蓋前備份／備份文件夾位置」歸入獨立「備份」分組。
- 設置頁移除「覆蓋前備份」分組標題（選項保留）。
- 遠程目錄安裝現會抓取並寫入 icon.svg（可選；新版缺 icon 自動刪舊檔）。
- 修復設置頁語言切換無效：下拉改語言後界面即時重載（此前僅存檔不重繪）。
- 設置頁「從 URL 安裝」與 GitHub Releases 輸入框加寬（120px→394px，行寬 64%）；窄屏自動回退。
- **深度 bug 排查修復 8 項**：自更新自毀窗口（self 分支不刪運行目錄）、備份失敗中止安裝（三路徑）、遠程 dir 安裝原子化（tmp 同構）、adapter.rmdir ENOENT（exists 前置檢查）、releaseChannels per-plugin 頻道覆蓋生效、busy 旗標覆蓋遠程安裝路徑、changelog 按優先級短路抓取、URL 安裝框支持 Enter 提交。
- **官方社區目錄掃描器合規修復**：6 errors 清零（await 非 Thenable／靜態樣式賦值／不必要斷言／未用 import／TFolder cast→duck typing／loadData any）。剩 2 advisory warnings（聲明式設置 API 遷移建議，不阻塞）。

### Changed
- 設置頁遷移 1.13+ 聲明式設置 API（getSettingDefinitions）——設置項可被官方設置搜索索引；minAppVersion 1.5.0 → 1.13.0。
- 官方社區目錄掃描器 0 errors 0 warnings 全綠。

### Added
- 候選列表 Modal：掃描出的多個插件候選一次列出、勾選批量安裝（壞候選禁用、覆蓋默認不勾、單個失敗不中斷批量）。
- 插件啟動時自動建立掃描根目錄與備份目錄（如 `_plugins`、`_plugins/backup`）。
- **變更日誌預檢**（showChangelog，默認 before＋release_notes）：安裝/升級前彈出 changelog＋插件信息卡，確認前不寫任何文件；after/off 模式；release notes 與 CHANGELOG.md 來源優先級可選（互為 fallback，零 GitHub API）。
- **從 GitHub Releases 安裝**（零 GitHub API）：任意 GitHub 鏈接格式智能清洗（scrubRepositoryUrl：user/repo、/tree/、/releases/tag/、git@、raw、API、簡寫）；latest release 自動解析（canonical link＋expanded_assets 爬取）；支持歸檔與裸三件套兩種資產形態。
- **Release 頻道**（releaseChannel，全局默認 beta，可按插件覆蓋）：stable＝最新 release；beta 的 pre-release 貼具體 /releases/tag/ 鏈接安裝。
- 新命令 install-from-github；設置頁新增 GitHub Releases 安裝與頻道設置（i18n 五語言）。
- **tar / tar.gz / tgz 壓縮檔支持。** vault 內掃描與遠程 URL 直鏈均支持；內置最小 USTAR tar 解析器＋fflate gunzip（零新依賴），GNU long name／PAX path／ustar prefix 兼容；路徑穿越/條目/大小防護與 manifest 定位語義與 zip 完全一致。
- **命令入口「從 URL 安裝」（`pluscan:install-from-url`）。** Modal 對話框（AddUrlModal）＋統一錯誤處理入口；作為 1.14 設置彈出窗口（獨立 OS 窗口內 imperative 按鈕事件失效，上游問題）的繞行路徑，同時更適配移動端無設置頁滾動場景。設置頁入口保留。
- **US-004：遠程 URL 安裝（P1）。** 雙模式：①裸目錄 URL（強制 https/localhost 放行、URL 清洗、styles.css 僅 404/410 算缺失、缺 styles 刪舊檔、id 白名單＋minAppVersion 預檢）；②`.zip` URL 直鏈（復用 US-003 zip 管線，路徑穿越防護全生效）。設置頁「從 URL 安裝」入口，i18n 五語言。
- **US-003：vault 內 zip 安裝。** 掃描配置文件夾內 `.zip`（fflate 解壓，~10KB 增量）；支持頂層或單一根子目錄布局（自動裁剪前綴）；安全防護：路徑穿越條目丟棄（`../`、絕對路徑、反斜線）、條目數≤500、總解壓≤50MB；安裝流程與裸目錄共用（manifest 校驗→minAppVersion 預檢→覆蓋備份→tmp 寫盤→啟用→如實報錯）。
- Git 機制：`.gitignore`、`HANDOFF.md`（開發交接說明）。
- 門禁機制：`scripts/gate.mjs`（8 類規則檢查器）、`.githooks/`（pre-commit + commit-msg，`core.hooksPath` 已設）、`.github/workflows/ci.yml`。提交信息強制 `<type>: <subject>`。
- 每改必記：`CHANGELOG.md`（本檔）＋ `LOG.md`（含驗證證據的落地記錄）。
- 官方 workflows：`.github/workflows/ci.yml`（gate＋tsc＋build＋obsidian-workflows validate）與 `release.yml`（tag push → mode: release）。
- 骨架（US-001/002）：掃描 vault 內 `_plugins/`（可配置）下的裸目錄（含 manifest.json），列出候選；一鍵導入到 `.obsidian/plugins/<id>/` 並啟用。含 manifest 校驗、安裝前確認卡、覆蓋保護、原子寫盤、i18n 五語言（zh-tw/ja/en/fr/de）、設置頁。

## [Unreleased]
## 0.2.2
_2026-10-22_

### Added
- **移動端兼容檢查**：`isDesktopOnly` 插件在行動裝置上預檢拒裝；確認卡與候選列表顯示兼容狀態；錯誤通知五語言。


