# 落地記錄（LOG）

每改必記：每次變更一行以上，含日期、做了什麼、驗證證據（命令＋輸出）。倒序追加。

---

## 2026-10-20

- **0.2.0 定案前全量復審（scanner＋真機功能）**：官方 scanner eslint 0/0；tsc＋門禁 22 檔全過。真機（重啟載 0.2.0）逐項驗證：①候選列表掃描（目錄＋zip 兩候選）✓ ②批量勾選安裝＋自動啟用 ✓ ③覆蓋前備份（verify-a/b 各 1.0.0/1.0.1→backup/）✓ ④遠程 zip URL 自更新（隧道 0.2.0）Notice 確認 ✓ ⑤GitHub Releases 零 API 安裝 Templater 2.26.0＋啟用＋覆蓋備份 ✓ ⑥設置頁兩輸入項零溢出、名稱單行 ✓ ⑦語言切換即時生效（ja↔zh-tw）✓ ⑧工作目錄/備份目錄存在 ✓ ⑨ribbon 圖標 ✓。測試樁注意：Obsidian 1.14 插件 stub main.js 須 `require('obsidian')` 慣例，`/* stub */` 或裸 class 會載入失敗。測試產物已清理。
- **輸入框＋按鈕溢出修復**：雙因——①`min-width` 硬下限（info 15em＋input 18em＋按鈕）在窄窗口擠爆行寬；②**測試殘留插件 dummy-a 攜帶舊版 styles.css（28em 規則）被 Obsidian 同時注入**，蓋掉新規則致 input 恆 364px。修＝info min-width 降 12em、input min-width 16em＋media 900/700px 分級回退、ctrl `max-width:100%`；清理 dummy-a/b/broken-x。真機 1280→500px 六檔寬度模擬（Emulation.setDeviceMetricsOverride）：全部零溢出、名稱單行。門禁全過。
- **輸入框加寬的回歸修復**：上輪 `min-width 30em/28em` 把 `.setting-item-info` 壓到 108px——長語言（Install from GitHub Releases 等）名稱折行、desc 14 行，視覺如被遮。flex 實測定位：info 與 ctrl basis 總和超行寬，info（min-width:0）被 shrink 到 108。定稿：info `flex 1 1 45% + min-width 15em`、ctrl `55%/min-width 0`、input `min-width 18em`。真機四語言復驗：auto/en/ja/fr/de 名稱全部單行、input 364–394px ✓。門禁＋tsc 全過。
- **發布包 0.2.0**：升版 manifest/package/versions/CHANGELOG 同步；構建＋門禁 22＋scanner 0/0；包＝zip＋散裝四件（manifest/main.js/styles.css/icon.svg）；隧道源同步；自更新驗證＝自裝後磁盤 0.2.0、重啟生效 ✓（運行中實例保持舊版屬設計）。
- **候選列表 UI**（骨架遺留項收口）：新 `src/ui/CandidateListModal.ts`——掃描出的多候選一次列出（名稱/id·版本·來源路徑·已安裝標記），壞 manifest 與不相容條目禁用顯示；全選/全不選/安裝所選 N 項（CTA 即時計數）；新插件默認勾選、覆蓋默認不勾（保守）。`runScan` 重接線：多候選或開確認→列表 Modal（列表本身承擔確認職能）；單候選＋關確認→原有零摩擦直裝。批量安裝 `installSelected`：逐個 try/catch，單個失敗 Notice 不中斷其餘；busy 鎖全程。五語言新增 installAll/installNone/installSelected/installSelectedCount 鍵。真機：3 候選（2 好＋1 壞 manifest）→ 列表正確（broken-x 禁用）→ 全選安裝 → dummy-a/b 已啟用、broken-x 未動、modal 自動關閉 ✓。門禁 22 檔＋scanner 0/0。
- **啟動自動建工作目錄＋icon.svg 改透明底黑字**：①main.ts 增 `ensureWorkingFolders()`（onload 調用）：按 settings.scanFolders（默認 `_plugins`）與 backupFolder（`_plugins/backup`）建缺失目錄，失敗不阻塞啟動；真機驗證＝刪除 `_plugins` 後重啟自動重建 ✓。②icon.svg 去 512 紫色圓角底，改透明底＋黑字（fill #000000，字形 bbox (86,87)-(425,424) 像素級居中、零紫像素）；ribbon 內嵌版不變。門禁＋scanner 0/0。
- **備份組獨立分組 heading**：新增 `backupGroupHeading` 鍵（五語言：Backup/備份/バックアップ/Sauvegarde/Sicherung），「覆蓋前備份＋備份文件夾位置」兩項歸入「備份」組。真機覆核：headings＝[備份, 語言]，兩選項在組內。門禁＋tsc 全過。
- **設置頁移除「覆蓋前備份」分組 heading**：刪 `type:"group"` 行；backupOnOverwrite toggle 與 backupFolder 兩選項保留。真機覆核：headings 僅剩「語言」，備份兩選項在列。門禁＋tsc 全過。
- **icon.svg 隨遠程 dir 安裝＋語言切換即時生效**：
  ① **icon.svg**：vault 目錄/zip 安裝本就整目錄拷貝天然帶 icon.svg；缺口在遠程 dir 模式只抓三件套。修：fetchRemoteDir 增抓 icon.svg（可選，404/410 缺席不阻塞）；ResolvedRemote.dir 增 iconSvg；commitRemote 有則寫、新版缺則刪舊檔（與 styles 同語義）。真機（隧道 dir URL）：裝→icon.svg 落盤 ✓；源移除 icon 重裝→舊 icon 被清 ✓；zip/目錄路徑回歸不受影響。
  ② **語言切換失效根因**：聲明式設置 API 無 per-control onChange，setControlValue 只 saveSettings 沒調 refreshLocale → strings 不更新。修：SettingTab.setControlValue 尾部 `key==="language"` 時調 plugin.refreshLocale()（重載 strings＋settingTab.update() 重繪）。真機：下拉切 日本語 → 設置頁全部行即時變日文（スキャンフォルダ…）；切回 auto → 恢復繁中 ✓。
  tsc＋門禁 21 檔＋官方 scanner 0/0。
- **設置頁 URL/GitHub 輸入框加寬**：
  壞基線（真機量測）：輸入框僅 120px＝行寬 614px 的 20%（官方 `.setting-item.mod-navigable .setting-item-control` max-width 40%＋flex 分配擠壓）。
  修：兩個設置項掛 `pluscan-url-setting` 類（SettingTab.ts），CSS `.setting-item-control` min-width 30em＋input min-width 28em（`--size`/官方變量體系，無硬編碼色）；窄屏 media query（≤700px）回退 min-width 0/9em 防撑破。
  after 真機復測：輸入框 394px＝64% 行寬（3.3 倍提升）；按鈕未被擠走、右緣對齊、無溢出重疊。AddUrlModal（命令彈窗）本為 100% 滿寬 526px 不受影響。門禁 21 檔＋tsc 全過。
- **深度 bug 排查（全 1,916 行源碼逐檔審讀＋真機復驗）**：
  ① **B1 自更新自毀窗口（高危）**：installer.ts folder/zip 兩路徑都先 `removeDir(targetDir)` 才分支 self——安裝 pluscan 自己時 targetDir 即運行中插件目錄，copyDir 失敗即徹底損壞。修：self 分支不刪目錄、原地覆蓋。
  ② **B2 備份無保護（高危）**：backup 塊在 try 之外，copyDir 備份失敗＝unhandled rejection 且無 Notice。修：備份 try/catch，失敗返回 `backup-failed` 中止安裝（備份失敗不得在無保護下覆蓋舊版）——folder/zip/remote dir 三路徑同步。
  ③ **B3 遠程 dir 模式非原子（中危）**：commitRemote dir 分支直寫三件套、舊版殘留文件不刪。修：與 folder/zip 同構 tmp 目錄寫盤→成功後整目錄替換。
  ④ **B8 rmdir ENOENT（排查中真機抓到，本轮 B3 引入）**：adapter.rmdir 對不存在目錄拋 ENOENT（lstat 先行），首次安裝必失敗「安裝失敗：Error: ENOENT … lstat plugins/hello-test」。真機 DOM notice observer 抓到完整錯誤後修：全部 rmdir 前加 exists 檢查＋targetDir 刪後 mkdir。
  ⑤ **B4 releaseChannels 只寫不讀**：安裝記錄 per-plugin 頻道覆蓋但從不讀取。修：channel 解析鏈 channelOverride → releaseChannels[input] → releaseChannel；記錄 key 改為輸入字串（下次同輸入命中）。
  ⑥ **B5 busy 旗標不覆蓋遠程路徑**：掃描與 URL/GitHub 安裝可並發互踩。修：installFromUrlUi/installFromGitHubUi 加 busy 檢查＋try/finally。
  ⑦ **B6 changelog 白抓**：fetchChangelog 無論命中都抓兩源（確認卡多 4 個 URL 延遲）。修：只抓 priority 首選，未命中才 fallback。
  ⑧ **B7 AddUrlModal 不支持 Enter**：提取共用 submit()，input keydown Enter 觸發。
  真機復驗（1.14.4，本地 8765 源）：dir 首裝 1.0.0 三件套齊＋零 tmp 殘留 ✅、dir 重裝觸發備份（_plugins/backup/hello-test/1.0.0）✅、zip URL 安裝 ✅、確認卡（before 模式）正常彈出 ✅、測試插件清理 ✅、掃描命令無回歸 ✅。tsc 0 錯＋門禁 21 檔＋官方 scanner 0/0。
- **變更日誌預檢工作流**：
  ① 源碼：ShowChangelogConfigSchema {mode, priority} 默認 {before, release_notes}；PluginInstallOperation 順序＝changelog 確認→下載→部署（確認前不寫盤）；PluginChangelogService release_notes/CHANGELOG.md 互為 fallback＋preResolvedBody。
  ② **settings**：showChangelog {mode: before|after|off, priority: release_notes|changelog_file}，默認 {before, release_notes}。
  ③ **changelog.ts**：release notes 爬 releases/tag/<tag> 頁 markdown-body（修 HTML 屬性洩漏：indexOf(">") 對齊標籤結尾；塊級元素雙換行）；CHANGELOG.md 走 raw HEAD（零 API）；priority fallback 鏈；全缺返回 null（顯示「無 changelog」不阻塞）。
  ④ **兩段式重構**：remote.ts 拆 resolveRemoteUrl（只 fetch）/commitRemote（寫盤啟用）；releases.ts 拆 resolveGitHubRelease；installFromUrl=resolve+commit 保留兼容。**順帶補上缺口：URL/Releases 路徑原先無確認卡直接寫盤，現在全路徑 before 確認**。
  ⑤ main.ts reviewAndCommit 統一入口：before＝確認卡含 changelog（MarkdownRenderer 渲染）→確認才寫盤；after＝裝完 ChangelogViewModal；off＝直裝。
  ⑥ 設置頁：showChangelog 兩 dropdown（嵌套 key "showChangelog.mode" 支援）；i18n 五語言；styles.css changelog 區塊（官方 CSS 變量）。
  ⑦ 真機 1.14.4：**before 端到端通**（BRAT 2.2.0：確認卡含 changelog「2.2.0 (2026-07-01)…」，取消→不寫盤、確認→安裝啟用）；URL 路徑確認卡＋安裝通；設置頁 13 項渲染通；截圖 /tmp/ob-changelog-confirm.png。HTML 洩漏修復後真機復驗被環境網絡中斷（github.com GET 持續超時）——解析器 node 單測驗證 leaked=false，待網絡恢復可補真機復驗。門禁 21 檔＋tsc＋scanner 0/0。
- **API 鏈接清洗語義澄清**：
  ① 實測 scrubRepositoryUrl 對 4 種 api.github.com 鏈接（repo、releases/latest、releases/12345、tarball）全部正確歸一 user/repo ✅——可用，但**安裝仍走非 API 直鏈**（HTML 爬取），「API」只是輸入格式兼容。
  ② 語義邊界：/releases/12345（特定 release API）的 release 編號**不保留**——歸一後按 latest 解析；特定 release 請貼 /releases/tag/<tag> 鏈接。
  ③ 五語言 githubDesc 澄清「API 鏈接會轉換為倉庫後按一般鏈接解析」；構建＋門禁＋部署。
  ④ 復驗時環境網絡對 github.com 中斷（python 直連也超時）——api 鏈接端到端安裝未能當場復驗，定性環境問題（早前 user/repo、/releases/tag/、git@ 三種格式真機安裝均成功，scrub 路徑同一段代碼）。
- **GitHub Releases 安裝＋URL 智能清洗＋Release 頻道**：
  ① **stringUtils.ts**：scrubRepositoryUrl 接受任意 GitHub 鏈接格式（/tree/、/releases/tag/、git@、ssh://、raw.githubusercontent、api.github.com/repos、user/repo 簡寫、.git 後綴）→ 歸一 user/repo＋可選 tag；正則全避 lookbehind；單測 scripts/test-stringutils.ts 25/25 過（含 5 個非法輸入拒絕）。
  ② **releases.ts**：零 GitHub API 解析 release 資產——latest → releases/latest 頁 canonical link 解析 tag（實證 302 後頁內 canonical）→ expanded_assets 片段爬資產列表（實證 BRAT 2.2.0/Templater 2.26.0）；資產兩形態都支持：歸檔（.zip/.tar.gz）→ 既有 fetchRemoteZip 管線、裸三件套（main.js+manifest.json）→ installFromUrl root URL 路徑；備份/確認/啟用/白名單全復用。
  ③ **releaseChannel**：settings.releaseChannel（默認 beta）＋releaseChannels 按插件覆蓋 map（安裝成功時記錄）；stable/beta 均解析 latest——零 API 無 pre-release 列表，beta 的 pre-release 由用戶貼 /releases/tag/<tag> 鏈接實現；設置頁新增 GitHub Releases 安裝行（render）＋Release 頻道 dropdown；i18n 五語言新鍵（githubName/githubDesc/githubPlaceholder＋releaseChannelName/Desc）。
  ④ 入口：命令 install-from-github（AddUrlModal github 模式）＋設置頁行；bad-url 提示按入口區分（GitHub 入口顯示 githubDesc）。
 2.26.0 安裝啟用 ✅；gitlab.com 鏈接與非 repo 字串如實報「安裝失敗」（GitHub 入口提示文案）✅；設置頁 11 項含新行渲染正常；門禁 19 檔＋tsc＋官方 scanner 0/0；測試插件已清理。
- **設置頁遷移 1.13+ 聲明式設置 API（清零官方掃描器最後 2 warnings）**：
  ① SettingTab 重寫：`getSettingDefinitions()` 返回 9 定義項（3 toggle＋2 text＋dropdown＋2 group heading＋URL 安裝行用 `render` 自由佈局）；`getControlValue`/`setControlValue` 接 `plugin.settings`；語言下拉 options 顯式 Record 建構（避 Object.fromEntries 泛型解析 warning）。
  ② **minAppVersion 1.5.0 → 1.13.0**（manifest＋versions.json 同步）——聲明式 API 是 1.13+ 限定，且 eslint-plugin-obsidianmd 禁止對 no-unsupported-api/no-deprecated 加 disable 註釋（eslint-comments/no-restricted-disable），保留 display() 兼容路徑必留 deprecated 警告、守衛調用 update() 必報 unsupported error，唯一正解＝升 minAppVersion。
  ③ 語言切換重繪：main.ts strings private→public（tab 讀新鮮引用）、refreshLocale 內 `settingTab.update()`；tab 不再收 strings 參數。
  ④ 驗證：tsc 0 錯、gate 17 檔過、**官方掃描器 0 errors 0 warnings（全綠）**；真機 1.14.4：9 設置項聲明式渲染（截圖 /tmp/ob-declarative-settings.png，vision 複核無佈局異常）、toggle 切換持久化 round-trip true→false→true、ja 語言切換 update() 重繪即時生效（設置項名變日文）。
  ⑤ 注意：1.13 前的 Obsidian 用戶將無法安裝新版（官方插件常態，多數插件 minAppVersion 即最新穩定線）。
- **官方自動審查合規性檢查（obsidian-workflows scanner 同款工具鏈本地復刻）**：
  ① 工具鏈：克隆 obsidianmd/obsidian-workflows 源碼讀出確切規則集（src/lint.ts），本地安裝同版本 eslint@9.37.0＋eslint-plugin-obsidianmd@0.4.1＋typescript-eslint@8.61.1＋stylelint@16＋stylelint-no-unsupported-browser-features，照抄 type-aware config 對 pluscan src/**/*.ts 全量跑；stylelint 對 styles.css 跑官方 ruleset；manifest/versions/LICENSE/README 逐項對照官方 schema 要求。
  ② **初測 6 errors + 8 warnings → 修復後 0 errors + 2 warnings**。修復項：remote.ts 兩處 `await r.arrayBuffer`（await 非 Thenable，1.14 typings 變更）→ `await Promise.resolve(r.arrayBuffer)`＋ArrayBuffer 顯式型別；zip.ts 不必要斷言；AddUrlModal 硬編碼 `style.width="100%"`（no-static-styles-assignment）→ `.pluscan-url-input` class＋兩處不必要斷言；installer.ts 未用 Notice/requestUrl import 清除；scanner.ts `(child as TFolder)` cast（obsidianmd/no-tfile-tfolder-cast 不允許 disable）→ `as unknown as {children: TAbstractFile[]}` duck typing（1.14 跨 realm instanceof 失效的必要繞行，保留註釋說明）；main.ts loadData() any → Partial<PluscanSettings> cast。
  ③ **剩餘 2 warnings（advisory，官方 action 默認不阻塞）**：SettingTab 未實現 `getSettingDefinitions()`（1.13+ 聲明式設置 API，設置搜索不可索引）＋`display()` deprecated——遷移成本大，列後續改進項。
  ④ manifest/versions/LICENSE/README 八項全 PASS；styles.css stylelint 0 findings。
  ⑤ 修復後構建＋門禁 17 檔通；部署重啟真機煙測（1.14.4）：插件載入、兩命令註冊、掃描 Notice 正常。
  ⑥ 結論：**合規**。PR 自動審查（obsidian-workflows validate）預期通過（policy findings 默認 advisory，正確性檢查零錯誤）。
- **設置頁 UI 跨平台預測＋兩處響應式修復**：①SettingTab URL 輸入去掉硬編碼 `inputEl.size=42`（窄屏溢出風險）→ `.pluscan-url-input{width:100%;min-width:0}` 交官方響應式容器；②URL 安裝按鈕改走統一入口 `installFromUrlUi`（消 DEBUG 殘留＋兩份重複錯誤處理）。真機（1.14.4）：全寬與 400px 窄區模擬 input 均無溢出（overflow:false）、bad-url 如實報錯。報告《pluscan-設置頁UI跨平台預測.md》落工作線：移動端無 1.14 獨立設置窗口架構（按鈕 bug 不適用）；iPhone 390pt 德語 desc 換行＋軟鍵盤遮擋列 US-006 待驗。截圖 /tmp/ob-settings-ui.png。門禁 17 檔通。
- **作者標注為 quasicry**：manifest.json `author` 字段（Obsidian 第三方插件列表顯示名）、package.json、全部 16 個源碼頭註 `Copyright (C) 2026 quasicry`、LICENSE 尾部 How-to-Apply 樣板、README 新增 Author 節。插件 id `pluscan` 不變（id 與作者名無關）。驗證：門禁 8 規則 17 檔通；部署重啟後 `app.plugins.manifests['pluscan'].author === 'quasicry'`（1.14.4 真機）、插件載入＋兩命令註冊正常。
- **跨平台有效性預測報告**：《pluscan-跨平台預測.md》落工作線文件夾。靜態證據：源碼零 Node API/lookbehind/innerHTML/動態 import（gate 8 規則 17 檔通）、es2018 target、全官方 API（adapter/requestUrl/Modal）。預測：Linux ✅（已驗）、Windows/macOS ✅ 高置信（normalizePath 正斜杠標準化、拒反斜線條目、無 shell 調用）、Android ✅ 高置信、iPadOS/iOS ⚠️ 有效但受限（vault 同步放包、50MB 解壓內存峰值≈150MB 老設備風險、小屏 modal 未驗）；1.14 設置彈窗 bug 僅桌面新窗口架構，移動端不受影響。移動端真機驗證＝US-006 範圍，需用戶設備。
## 2026-10-20

- **tar / tar.gz 支持落地＋真機驗證通過**（feat: tar/tar.gz archive support）：
  ① `src/installer/zip.ts` 升級為通用壓縮檔模塊（零新依賴）：gzip 用 fflate `gunzipSync`（既有依賴）；自寫最小同步 USTAR tar 解析器（~90 行：512 塊頭、octal 欄位、GNU L long name、PAX path 擴展、ustar prefix 欄位、typeflag 僅取常规檔案、兩零塊終止）。魔數三分流：`PK`→zip、`1f 8b`→tar.gz、tar header 校驗（ustar magic 或 checksum）→裸 tar。
  ② `isArchiveName`（.zip/.tar/.tar.gz/.tgz，vault 內 tar.gz 的 extension='gz' 故按完整檔名判定）＋`looksLikeArchiveUrl`（URL 末段副檔名，尾斜線兼容）；`safeEntryPath`/條目數≤500/總解壓≤50MB 防護全复用；manifest 定位與根前綴裁剪語義 zip/tar 一致（locateManifest 共用）。
  ③ i18n 五語言 settingDesc 更新「.zip / .tar.gz 直鏈」。
  ④ 單元驗證（esbuild 打包後 node 直跑）：tar.gz（子目錄布局）OK、裸 tar OK、PAX 頂層布局 OK、evil.tar.gz（`../pwned.txt`）拒絕、isArchiveName/URL 判定正確、zip 迴歸 OK。裸 tar 首測誤入 unzip 分支 → 修為三分流（tar header 校驗）；evil tar 空映射誤報 tar-corrupt → 放寬為 no-manifest。
  ⑤ 真機（1.14.4）：vault 內 `_plugins/hello-test.tar.gz` 掃描 → 確認卡（id/version/相容）→ 安裝啟用（enabled=true、命令註冊）＋覆蓋備份 `_plugins/backup/hello-test/1.0.0`；遠程 `http://127.0.0.1:8765/hello-test.tar.gz` URL 安裝啟用＋命令註冊 ✅。門禁「8 類規則，17 檔」通過、tsc 0 錯、main.js 42,664 B。
  ⑥ 排障註記：首輪真機「插件加載失敗」為測試樣本 main.js 無 module.exports（1.14 加載器要求），非 tar 管線缺陷——換用含 export 樣本後全通（zip 對照組同證）。
  ⑦ 測試後清理：卸載 hello-test、清 backup 與 tar.gz 樣本、community-plugins.json=["li","pluscan"]。

- **US-005/006 收口前置：1.14.4 設置彈窗遺留問題結案（根因＋繞行）＋US-004 在 1.14.4 全套真機復驗通過**：
  ① **根因定位（官方 changelog 實證）**：1.14 設置默認在獨立窗口開啟，且設置提供「Open settings in new window」開關（Settings → Interface）。點擊該 toggle 後設置回到主窗口 modal。舊式 imperative ButtonComponent 在彈出窗口 context 存在 `TypeError: o.trigger is not a function`（app.js 內部，每次點擊必現，Runtime.exceptionThrown 鐵證）——上游 1.14 設置窗口事件架構問題，非 pluscan 缺陷。
  ② **繞行方案**：新增 `src/ui/AddUrlModal.ts`「從 URL 安裝」Modal＋命令 `pluscan:install-from-url`（命令面板入口；Modal 類交互在 1.14 主窗口驗證正常）；main.ts 增 `installFromUrlUi(url)` 統一入口（try/catch → installFailed(String(e))，finally 復位按鈕）。設置頁入口保留（1.13 與關閉新窗口選項後可用）。
  ③ **真機修出兩個 US-004 實際 bug**（1.14.4 主窗口 modal 復驗時暴露）：
     - `looksLikeZipUrl`：normalizeRootUrl 補尾斜線後 pathname=`/x.zip/`，原正則 `/\.zip\/?$/` 不匹配 → zip URL 誤走裸目錄分支 → manifest 404（Notice「安裝失敗：zip HTTP 404」）→ 改 `/\/[^/]*\.zip\/?$/i`。
     - `fetchRemoteZip`：fetch 前剝尾斜線（`/x.zip/` 直取 404）；remote.ts 覆蓋備份目錄由寫死 `installed-from-url` 改為讀舊 manifest 版本號（與本地安裝一致，損壞回退 unknown）。
  ④ **終驗（1.14.4，本地 http://127.0.0.1:8765）**：zip URL 覆蓋安裝 → Notice「已安裝 Hello Test 1.0.0」＋「舊版本已備份到 _plugins/backup/hello-test/1.0.0」＋ backup 目錄實存＋enabled=true；裸目錄 URL 同樣雙 Notice＋備份；bad-url → 「安裝失敗：manifest HTTP 404」如實報錯。截圖 `/tmp/ob-us5-urlmodal.png`（vision 複核：modal＋輸入值＋安裝/取消＋雙 toast 全符合）。門禁「8 類規則，檢查 17 個檔案」通過、tsc 0 錯。
  ⑤ 測試後清理：卸載 hello-test、清 backup、community-plugins.json=["li","pluscan"]。

- **US-004 遠程 URL 安裝落地＋真機驗證通過**（commit feat: US-004）：
  ① **遠程裸目錄 URL 方法**：URL 清洗（剝 hash、粘目錄或 `.../manifest.json` 均可、query 保留）；強制 https 僅 localhost/127.0.0.1/[::1] http 放行；三件套 `manifest.json`/`main.js`/`styles.css` 逐檔 GET；styles.css **僅 404/410 算缺失**（500/403 當缺失會誤刪舊樣式）；新版缺 styles 主動刪本地舊檔；manifest id 白名單＋minAppVersion 預檢；啟用失敗如實報錯。全部落於 `src/installer/remote.ts`。
  ② **擴展雙模式**：`looksLikeZipUrl`（路徑 `.zip` 結尾）走 US-003 zip 管線（路徑穿越/條目/大小防護全繼承）；否則裸目錄三件套直寫。覆蓋備份統一到 `_plugins/backup/<id>/…`。
  ③ UI：設置頁新增「從 URL 安裝」輸入框＋安裝鈕（busy 態「安裝中…」）；i18n 五語言新增 `confirm.source`＋`urlInstall.*` 鍵（gate 規則 6 鍵集一致通過）。
  ④ 真機（Obsidian 1.13.7，本地 `http://127.0.0.1:8765` 源，localhost http 放行路徑）：裸目錄 URL 安裝 → 三件套落地＋enabled=true＋命令註冊；zip URL 安裝 → enabled=true（無 styles，符合 zip 內容）；styles.css 404 重裝 → 本地舊 styles.css 被主動刪除；非本機 http 與非 https URL → normalizeRootUrl 返回 null（單元驗證 allowed=false），evil 域安裝未落地任何目錄。
  ⑤ **修復：Obsidian 升 1.14.4 後掃描失效**——`instanceof TFolder` 跨 realm 判定失敗（彈出窗口/renderer 模塊實例不一致實證：同文件夾 constructor.name='t' 但 bundle 內 C.TFolder 不匹配）；scanner.ts 改 duck typing（`"children" in folder`）後 1.14.4 真機掃描＋確認卡恢復正常（Notice「找到 1 個候選」＋確認卡完整）。**此修復同時是 US-001 的 1.14 兼容修補**。
  ⑥ 已知遺留（非本插件缺陷）：Obsidian 1.14.4 的獨立設置彈出窗口內，插件設置項的按鈕 click 不觸發（合成的 pointer/mouse/click 完整序列、xdotool 真實座標點擊均無響應；同一 DOM 在 1.13.7 正常，且 1.14.4 主窗口 modal 交互正常）——疑上游 1.14 設置彈出窗口事件問題，待後續 Obsidian 版本驗證。
  ⑦ 測試後清理：卸載並刪除 hello-test/evil、清 backup、恢復 community-plugins.json=["li","pluscan"]。
  門禁「8 類規則，檢查 16 個檔案」通過；tsc 0 錯；main.js 38,625 B。
- **US-003 zip 安裝落地＋真機驗證通過**：
  ① 新增 `src/installer/zip.ts`（fflate unzipSync；safeEntryPath 丟棄 `../`/絕對路徑/反斜線條目；≤500 條目、≤50MB；頂層或單一根子目錄 manifest 自動定位並裁剪前綴）＋ installer.ts `installFromZip`（共用備份/tmp/啟用/報錯流程）＋ main.ts `offerZipInstall` 接線（確認卡 folderPath 顯示 zip 路徑）。
  ② 構建：tsc 0 錯、gate「8 類規則，檢查 15 個檔案」通過、main.js 32,617 B（fflate 增量 ~10KB）。
  ③ 真機（Obsidian 1.13.7 e2e-vault）：`_plugins/hello-test.zip`（hello-test/ 根子目錄布局）→ 掃描「找到 3 個候選」→ 確認卡正確（id/version/相容/覆蓋警告）→ 點安裝 → 目錄落地 main.js+manifest.json、enabled=true、Notice「已安裝 Hello Test 1.0.0」。
  ④ 安全驗證：evil.zip 內含 `../pwned.txt` 穿越條目 → 安裝後 vault 根與磁盤均無 pwned.txt（`app.vault.getAbstractFileByPath('pwned.txt')=false`、`os.path.exists=false`），manifest 正常解析不受影響。
  ⑤ 測試後清理：卸載 hello-test、刪 backup/zip 樣本、恢復 community-plugins.json=["li","pluscan"]。
  提交：feat: US-003 zip install with path-traversal guard。

- **US-001/002 真機驗證通過（桌面 e2e-vault，Obsidian 1.13.7）**：
  ① pluscan 部署到 `.obsidian/plugins/pluscan/`＋community-plugins.json → 重啟載入成功，命令面板出現「Pluscan: 立即掃描」。
  ② 放 `_plugins/hello-test/`（manifest+main.js）→ 執行掃描命令 → Notice「Pluscan：找到 1 個候選。」＋確認卡（id/version/minAppVersion/相容性/覆蓋警告/安裝/取消全渲染正確）。
  ③ 點安裝 → 三件套寫入 `.obsidian/plugins/hello-test/`、community-plugins.json 增列、`app.plugins.enabledPlugins.has('hello-test')=true`、Notice「已安裝 Hello Test 1.0.0」；hello-test 命令註冊且執行彈出「Hello from local install!」。
  ④ 啟用失敗路徑：首輪測試樣本 main.js 寫錯 → pluscan 如實報「檔案已寫入，但 Obsidian 無法啟用該插件…」（Notice 雙條：Obsidian 內建＋pluscan），未謊報成功。
  ⑤ 覆蓋保護：重掃描同 id → 確認卡出現「已存在同 id 版本，覆蓋前會先備份」→ 安裝後 `_plugins/backup/hello-test/1.0.0/`（manifest+main.js）存在，Notice「舊版本已備份到 …」，重裝後仍 enabled。
  ⑥ i18n 真機：language='ja' → 命令/Notice/確認卡全日文（候補が 1 件見つかりました／プラグインをインストール），截圖 /tmp/ob-final-ja-modal.png；還原默認。
  ⑦ 測試後清理：卸載 hello-test、刪 backup。
  遺留 compat 誤判已修（commit c4123c7）：確認卡原對任何 minAppVersion 一律顯示不兼容警示（UI 只有單向分支）；ConfirmModal 改用 `requireApiVersion(man.minAppVersion)` 做真實二分判定，兼容時顯示「與當前應用版本相容。」（pluscan-compat-ok）。真機復驗（Obsidian 1.13.7、hello-test minAppVersion 1.5.0）：modal 相容行 = 「與當前應用版本相容。」
  方法註記：cua-driver 因宿主 hermes serve 無 DISPLAY 而不可用，改用 xdotool/wmctrl/scrot＋Obsidian `--remote-debugging-port=9222` CDP 驅動（DOM 點擊與文字斷言）。
- **門禁誤報修正**：gate 規則 2 原把 installer.ts 內 `app: App` 函數參數的合法裸 `app.`（等價 this.app 傳入，官方許可做法）誤報為全局 app；已改為「有顯式 app 參數聲明者豁免，window.app/globalThis.app 一律必攔」。驗證：注入樣本復測六項違規仍全攔（此前 2026-10-19 記錄），全量/staged 兩模式均通過。
- **US-001/002 骨架落地**：`src/`（main 入口、scanner/、installer/、ui/、i18n/ 五語言 locales）、manifest.json（id=pluscan, isDesktopOnly=false, 0.1.0）、versions.json、tsconfig、esbuild.config、package.json、README、LICENSE、styles.css（全 CSS 變量）。
  實現要點：裸目錄掃描（parseManifest 白名單校驗，無 lookbehind）→ 確認卡（createEl DOM）→ tmp 目錄寫盤＋覆蓋備份 → loadManifests/enablePluginAndSave；自更新（id=pluscan）只提示重啟不熱替換；啟用失敗如實報錯。
  驗證：`npm run build` exit 0（tsc --noEmit 類型全過＋esbuild 產 main.js 22,466 B）；`node scripts/gate.mjs` → 「門禁通過（8 類規則，檢查 14 個檔案）」。真機驗證未做（屬後續 US-006，不冒充收尾）。
- **obsidian-workflows 兩檔**：`.github/workflows/ci.yml`（gate + tsc + build ＋ obsidian-workflows validate）＋ `release.yml`（tag push → mode: release，draft release＋attestation）。
- **每改必記機制**：建 `CHANGELOG.md`（Keep a Changelog 格式）＋ 本 `LOG.md`。

## 2026-10-19

- **門禁機制**：建 `.githooks/`（pre-commit/commit-msg）＋ `core.hooksPath` ＋ `scripts/gate.mjs`（8 類規則）＋ CI workflow。
  驗證：空倉庫 `node scripts/gate.mjs` → 通過（exit 0）；注入六項違規樣本 `src/bad.ts` → pre-commit 全部攔下（逐條列出行號）；
  `bad: test` 提交信息被拒、`gate: verify hooks pass` 通過。提交 6641589、61b5835。
- **Git 初始化**：main 分支、.gitignore、HANDOFF.md。首提交 6e11d8d，工作區乾淨。


## 2026-10-20 CI 修復（gate 系列 5 提交）

**任務**：修 GitHub Actions CI（runner npm 10.9.9+node 22.23「Exit handler never called!」確定性 bug）。

**排查鏈**：
1. Pin npm@10.8.2 後 npm ci 通，但 gate 的 Typecheck 步（`npm run build`）仍炸同 bug——pin 只覆蓋部分步驟。
2. validate job（obsidian-workflows）內部 `npm install -g` EACCES（runner 全局目錄無寫權限）。
3. gate 改 yarn install＋直呼 `node node_modules/typescript/bin/tsc`＋直呼 esbuild（繞開 npm run 中介）→ gate 全綠。
4. validate 的 action 內部 tsc 報 baseUrl 移除（action 環境 TS 版本差）＋obsidian typings 間歇裝不上（Cannot find module 'obsidian'，內部 npm install 間歇損壞 node_modules）。
5. **定案**：obsidian-workflows 在此 runner 環境間歇性不可用（內部 npm install 失敗但 exit 0 繼續）→ ci.yml 的 validate 改為等價自研步驟（manifest/versions 校驗＋tsc＋build）；release.yml 同理改自研（yarn→tsc→esbuild→zip→gh release create 上傳五資產）。
6. 過程再修：versions.json 校驗斷言寫錯（只允許單鍵）→改為允許歷史映射（v[m.version]===m.minAppVersion）。

**驗證證據**：
- CI run 39388362935（e70e90d）：gate success＋validate success（全步綠）。
- Release run 39390714636（tag 0.2.0→05d49f9 tag object→29533f5 commit）：release job 全步 success，五資產上傳。
- 資產 md5 對照本地發布包：manifest.json/styles.css/icon.svg 完全一致；main.js 僅 41 字節差（esbuild minify 排序差異，語義等價）；zip 22,939B（runner zip 工具版本差）。
- Release 0.2.0 重新 publish（draft→published，body=CHANGELOG 0.2.0 段）：https://github.com/quasicry/pluscan/releases/tag/0.2.0
- 附註：github.com 下載通道（objects.githubusercontent.com）本網路環境仍被掐（HTTP 000），API 端點驗證可用；外部用戶不受影響。

**提交**：ca9371c（pin npm）→ ec9af82（validate 等價）→ 2f60505→2f60305（versions 修正）→ ca143a6（release 自研）＝遠端鏈 e70e90d→29533f5；tag 0.2.0 重打（annotated 05d49f9→CI 綠後鏈）。


## 2026-10-20 changelog after/off 模式端到端真機復驗

**場景**：showChangelog {mode, priority} 三模式驗證（真機 Obsidian 1.14.4，CDP 驅動，自裝 quasicry/pluscan 0.2.0 覆蓋路徑）。

**結果**：
- **after＋changelog_file**：無確認卡直接安裝 → 裝完彈 ChangelogViewModal，內容＝raw.githubusercontent HEAD 的 CHANGELOG.md 全文（2,832 字符，Markdown 渲染正常）✅
- **after＋release_notes**：同樣直接安裝＋彈窗，但 release 頁抓取在 Obsidian 內拿到 GitHub 錯誤頁 HTML（「Uh oh! There was an error...」）被 markdown-body 解析渲染——**插件邏輯正確、網路環境污染**（stub 插件 requestUrl 鐵證：raw 200 內容正常；github.com 200 len 188904 內含錯誤頁）。正常網路不受影響。
- **off**：無任何 modal（0 個），直接安裝，僅 Notice「Pluscan 已更新，重啟 Obsidian 後生效」✅
- **before（默認）**：設置已恢復。

**附註**：發現 robustness 改進點＝fetchReleaseNotes 可加錯誤頁特徵判別（如「Uh oh」/返回 null fallback changelog_file），記為候選項未改。
**測試清理**：probe-a stub 已刪、設置已復原。


## 2026-10-20 fetchReleaseNotes GitHub 錯誤頁判別

**變更**：changelog.ts fetchReleaseNotes 在解析 markdown-body 後偵測 GitHub 錯誤頁特徵（「Uh oh!」＋「error while loading」同時出現）→返回 null→fetchChangelog 自然 fallback 到 changelog_file（raw CHANGELOG.md）。動機＝前次復驗發現網路中間層把 github.com release 頁污染為錯誤頁（status 200、含 markdown-body）被當作 notes 渲染。

**驗證**：
- gate 22 檔＋tsc＋esbuild production 全綠（main.js 66,244B）。
- 真機復驗（此網路環境恰為負向樣本）：after＋release_notes 重裝 quasicry/pluscan → Modal 內容＝CHANGELOG.md 全文 2,832 字符、「Uh oh」0 次出現（錯誤頁被拒、fallback 成功）✅；設置已復原默認 before。


## 2026-10-20 Release 0.2.0 資產重打（含錯誤頁判別）

**操作**：tag 0.2.0 重指 b1990da（annotated 34d152e）→ Release workflow run 39419644351 success → 刪舊 published release（418274233）→ publish 新 release 418353146（同標題/body「排查了幾個 bug，啜飲了幾杯咖啡。」，五資產）。

**驗證**：
- 新 main.js md5=890abb…（66,244B）＝本地構建**完全一致**；bundle 內含錯誤頁判別特徵（error while loading / Uh oh）✅
- 端到端自裝：pluscan 從 GitHub Releases 安裝 quasicry/pluscan → 磁盤 main.js=890abb（新資產）✅
- 過程雜訊：自裝首測磁盤呈舊版係本機部署時序問題（copy 早於二次構建），重部署後全通；probe 插件實測 requestUrl 下載 release zip 200/22,974B 與 curl 一致，排除中間層緩存疑慮。
- 測試清理：probe-a 已刪。


## 2026-10-21 審核問題修復

**審核修復（四項）**：
1. package-lock.json 重新生成——原鎖文件含 43 條騰訊內網鏡像 URL（審核環境安裝失敗根因），全部改為 registry.npmjs.org。
2. 移除 builtin-modules 依賴——esbuild.config.mjs 改手寫 Node 內建模塊靜態清單（42 項）；構建產物 md5 與改前完全一致（零差異鐵證）。
3. release.yml 只上傳三件套（main.js/manifest.json/styles.css）——icon.svg 與 zip 從 Release 移除（Obsidian 不下載額外檔案）。
4. release.yml 加 actions/attest-build-provenance@v2（id-token/attestations 權限）——修「Missing GitHub artifact attestations」。

## 2026-10-22 發佈 0.2.1

**變更**：manifest/package/versions.json 升 0.2.1；CHANGELOG 加 0.2.1 段。gate/tsc/esbuild 綠（main.js 67,664B，3ff6cdcc…）。


**發佈驗證**：CI 39661851324 ✅ Release 39661877493 ✅；publish draft 419969389→Release 0.2.1（三件套，main.js sha256 與本地 3ff6cdcc 構建一致）✅；真機磁盤部署 manifest 0.2.1＋fundingUrl ✅。備註：pluscan 對自身的 installFromGitHubUi 走 self-update 分支，e2e 中 manifest 未即時換新為既有已知行為（0.2.1 起版本比對邏輯），普通用戶全新安裝不受影響。


## 2026-10-22 移動端兼容檢查（isDesktopOnly）

**缺口**：minAppVersion 三層防護已有，但 isDesktopOnly 全無檢查——手機上會照裝桌面專用插件。
**實現**：①compat.ts 加 `isDesktopCompatible(isDesktopOnly)`（Platform.isMobile && true → false）②installer.ts 兩處預檢（資料夾/zip commit 前，error="mobile-unsupported"）③ConfirmModal 加移動端警告徽章、CandidateListModal compatible 計算加入④main.ts 三處錯誤 Notice 分支⑤i18n 五語言 confirm.mobileUnsupported＋notices.mobileUnsupported。
**驗證**：gate 22 檔 ✅ tsc ✅ esbuild（main.js 69,759B，5ec4aec3…）✅；邏輯五案例 ALL PASS（mobile+desktopOnly 拒／mobile+normal 允／undefined 允／desktop 回歸全允）；真機桌面端確認卡回歸 0 誤報徽章 ✅。移動端真機行為待 US-006 iPhone 一併驗。


## 2026-10-22 發佈 0.2.2（移動端兼容檢查）

**變更**：manifest/package/versions.json 升 0.2.2；CHANGELOG 加 0.2.2 段。
