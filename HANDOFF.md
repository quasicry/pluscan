# pluscan 開發交接說明

## 定位

從 vault 內本地文件安裝 Obsidian 插件的引導器（zip / 裸目錄 / 遠程 zip URL 三來源），
填補「在 Obsidian 內點選本地 zip → 解壓安裝 → 啟用」的空白。移動端優先。

- 插件 id：`pluscan`（已對官方 community-plugins.json 全量 8,795 條核實無衝突）
- 開發文件夾：`<測試vault>/.obsidian/plugins/pluscan/`（id 必須＝文件夾名）
- 發佈：GitHub Releases

## 必讀文檔（上層文件夾）

1. `../local-plugin-installer-draft.md` — PRD 草案 v0.1：功能、安全防護、US-001~007
2. `../pluscan-開發規範與工作流.md` — 官方編碼規範＋開發循環＋移動端注意事項＋提交前自檢清單

## 硬性規則（摘自規範報告，違反即返工）

- 開發只在**獨立測試 vault**，嚴禁主 vault
- 禁 `innerHTML/outerHTML/insertAdjacentHTML`、禁全局 `app`、禁硬編碼樣式
- 全程 vault adapter / Web API（isDesktopOnly=false 的前提）；正則**禁 lookbehind**（iOS 16.4 以下）
- UI 文案五語言 i18n（zh-tw/ja/en/fr/de），en 為基準鍵集，Sentence case，設置頁無頂層標題
- UI/交互改動必須真機驗證才算收尾

## Git 約定

- 主分支 `main`；提交信息用 `<type>: <subject>`（feat/fix/docs/refactor/test/chore）
- 發佈 tag：精確 `x.y.z`（無 v 前綴）＝ manifest.json version ＝ versions.json 新鍵
- CI/Release 用 obsidianmd/obsidian-workflows（骨架期一併加入 .github/workflows/）

## 下一步

US-001/002：掃描 `_plugins/` 裸目錄並列出候選 → 一鍵導入啟用（骨架期按規範報告第五節 ①~④ 走）。
