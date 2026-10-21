#!/usr/bin/env node
/**
 * pluscan 門禁（gate）檢查器 —— 提交/推送前本地執行，CI 同套規則。
 * 規則來源：pluscan-開發規範與工作流.md 第三節（官方 Plugin guidelines）
 * + PRD 硬性規則（i18n 鍵集一致、禁 lookbehind、禁 Node/Electron API）。
 *
 * 用法：node scripts/gate.mjs [--staged]
 * 退出碼：0 = 全過；1 = 有違規（逐條列出）。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const stagedOnly = args.includes("--staged");
const esbuildCfg = join(root, "esbuild.config.mjs");
const hasCfg = statSync(esbuildCfg, { throwIfNoEntry: false }) !== undefined;

const violations = [];
const add = (file, line, rule, msg) => violations.push(`${file}:${line}  [${rule}] ${msg}`);

// ---------- 目標檔案收集 ----------
function listFiles(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === "build") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) listFiles(p, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

let tsFiles;
if (stagedOnly) {
  const { execSync } = await import("node:child_process");
  const out = execSync("git diff --cached --name-only --diff-filter=ACMR", { encoding: "utf8" });
  tsFiles = out.split("\n").filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
} else {
  try {
    tsFiles = listFiles(join(root, "src"), [".ts", ".tsx"]);
  } catch {
    tsFiles = []; // 骨架前 src/ 可能不存在
  }
  if (hasCfg) tsFiles.push(esbuildCfg);
}

// ---------- 規則 1：禁 innerHTML / outerHTML / insertAdjacentHTML ----------
for (const f of tsFiles) {
  let src;
  try { src = readFileSync(join(root, f), "utf8"); } catch { continue; }
  src.split("\n").forEach((line, i) => {
    if (/\b(innerHTML|outerHTML|insertAdjacentHTML)\b/.test(line))
      add(f, i + 1, "SEC-DOM", "禁用 innerHTML/outerHTML/insertAdjacentHTML，改用 createEl() 等 helper");
    if (/\bdocument\.querySelector\b|\bdocument\.getElementById\b/.test(line))
      add(f, i + 1, "SEC-DOM", "禁直接 document 查詢，DOM 應從 Obsidian 傳入的容器元素建構");
  });
}

// ---------- 規則 2：禁全局 app（必須 this.app）----------
// 豁免：檔內聲明了 `app: App` 參數者，裸 `app.` 是傳入的實例引用（等價 this.app），
// 屬官方許可做法；window.app / globalThis.app 一律必攔。
for (const f of tsFiles) {
  let src;
  try { src = readFileSync(join(root, f), "utf8"); } catch { continue; }
  const hasAppParam = /\bapp\s*:\s*App\b/.test(src) || /\bapp\s*:\s*App\[/.test(src);
  src.split("\n").forEach((line, i) => {
    const l = line.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "");
    if (/\b(window|globalThis)\.app\b/.test(l))
      add(f, i + 1, "API-APP", "禁全局 app/window.app，使用插件實例的 this.app");
    if (!hasAppParam && /(^|[^\w.])app\.(workspace|vault|plugins|fileManager)\b/.test(l))
      add(f, i + 1, "API-APP", "裸 app.* 需經插件實例（this.app）或顯式參數傳入");
  });
}

// ---------- 規則 3：禁 Node / Electron API（isDesktopOnly=false 的前提）----------
const NODE_API = /(^|[^\w.])(require\(|from\s+["'])(fs|path|os|crypto|child_process|electron|http|https|net|util)(["']|\))/;
for (const f of tsFiles) {
  let src;
  try { src = readFileSync(join(root, f), "utf8"); } catch { continue; }
  src.split("\n").forEach((line, i) => {
    const l = line.replace(/\/\/.*$/, "");
    if (NODE_API.test(l)) add(f, i + 1, "API-NODE", "禁 Node/Electron API（移動端會崩潰），用 vault adapter / Web API");
    if (/\bprocess\.(env|cwd|platform)\b/.test(l)) add(f, i + 1, "API-NODE", "禁 process.*，平台判斷用 Platform.*");
  });
}

// ---------- 規則 4：正則禁 lookbehind（iOS < 16.4）----------
for (const f of tsFiles) {
  let src;
  try { src = readFileSync(join(root, f), "utf8"); } catch { continue; }
  src.split("\n").forEach((line, i) => {
    if (/\(\?<=|\(\?<!/.test(line)) add(f, i + 1, "MOB-REGEX", "正則 lookbehind 在 iOS 16.4 以下不可用，改寫捕獲組");
  });
}

// ---------- 規則 5：樣式必須走 class + CSS 變量 ----------
for (const f of tsFiles) {
  let src;
  try { src = readFileSync(join(root, f), "utf8"); } catch { continue; }
  src.split("\n").forEach((line, i) => {
    if (/\.style\.(color|backgroundColor|fontSize|border|padding|margin)\s*=/.test(line))
      add(f, i + 1, "STYLE", "禁硬編碼樣式，用 CSS class + 官方 CSS 變量");
  });
}

// ---------- 規則 6：i18n 鍵集一致（en 為基準）----------
function flatKeys(obj, prefix = "") {
  const keys = [];
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") keys.push(...flatKeys(v, key));
    else keys.push(key);
  }
  return keys;
}
const localesDir = join(root, "src", "i18n", "locales");
try {
  const localeFiles = readdirSync(localesDir).filter((f) => f.endsWith(".ts") && f !== "index.ts");
  const keysets = {};
  for (const lf of localeFiles) {
    const src = readFileSync(join(localesDir, lf), "utf8");
    // 語言包形如 export const en = { ... } / export default {...}；鍵集以 "key": 提取
    const keys = [...src.matchAll(/^\s{2,4}([A-Za-z0-9_]+):\s*["'`]/gm)].map((m) => m[1]);
    keysets[lf] = keys.sort();
  }
  const baseFile = "en.ts";
  if (keysets[baseFile]) {
    const base = new Set(keysets[baseFile]);
    for (const [lf, keys] of Object.entries(keysets)) {
      for (const k of keys) if (!base.has(k)) add(`src/i18n/locales/${lf}`, 0, "I18N", `多出 en 沒有的鍵: ${k}`);
      for (const k of keysets[baseFile]) if (!keys.includes(k)) add(`src/i18n/locales/${lf}`, 0, "I18N", `缺鍵: ${k}`);
    }
  }
} catch { /* 骨架前無 locales 目錄，跳過 */ }

// ---------- 規則 7：佔位類名 / 模板示例殘留 ----------
for (const f of tsFiles) {
  let src;
  try { src = readFileSync(join(root, f), "utf8"); } catch { continue; }
  if (/\bMyPlugin\b|\bSampleSettingTab\b|\bMyPluginSettings\b/.test(src))
    add(f, 0, "TEMPLATE", "殘留官方模板佔位類名，須改名");
}

// ---------- 規則 8：manifest 規範 ----------
try {
  const man = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
  if (man.id !== "pluscan") add("manifest.json", 0, "MANIFEST", `id 應為 pluscan，實際 ${man.id}`);
  if (!/^[a-z][a-z-]*$/.test(man.id ?? "") || /obsidian/.test(man.id ?? "") || /plugin$/.test(man.id ?? ""))
    add("manifest.json", 0, "MANIFEST", "id 違反官方字符/保留字規則");
  if (man.isDesktopOnly !== false) add("manifest.json", 0, "MANIFEST", "isDesktopOnly 必須 false（全程 vault adapter API）");
  if (!/^\d+\.\d+\.\d+$/.test(man.version ?? "")) add("manifest.json", 0, "MANIFEST", "version 必須 semver x.y.z");
  if (!man.description?.endsWith(".")) add("manifest.json", 0, "MANIFEST", "description 須以句號結尾");
  if ((man.description ?? "").length > 250) add("manifest.json", 0, "MANIFEST", "description 超 250 字符");
  if (/plugin/i.test(man.name ?? "")) add("manifest.json", 0, "MANIFEST", "name 不得含 Plugin 字樣");
  // versions.json 同步檢查
  try {
    const ver = JSON.parse(readFileSync(join(root, "versions.json"), "utf8"));
    if (ver[man.version] === undefined) add("versions.json", 0, "VERSIONS", `缺 "${man.version}" 鍵（與 manifest 不同步）`);
  } catch { /* versions.json 骨架前可缺 */ }
} catch { /* manifest.json 骨架前可缺 */ }

// ---------- 結果 ----------
if (violations.length) {
  console.error(`\n門禁未過（${violations.length} 條違規）：\n`);
  for (const v of violations) console.error("  ✗ " + v);
  process.exit(1);
} else {
  console.log(`門禁通過（8 類規則，檢查 ${tsFiles.length} 個檔案）`);
}
