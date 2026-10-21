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

// i18n 入口：語言判定（跟隨 Obsidian 或手動覆蓋）＋ 缺鍵回退 en。
import { moment } from "obsidian";
import en, { type EnStrings } from "./locales/en";
import zhTw from "./locales/zh-tw";
import ja from "./locales/ja";
import fr from "./locales/fr";
import de from "./locales/de";

export type { EnStrings };

const LOCALES: Record<string, EnStrings> = {
	en,
	"zh-tw": zhTw,
	zh: zhTw, // 簡中界面用戶暫回退繁中（zh-cn 包列入後續）
	ja,
	fr,
	de,
};

/** 語言鍵 → 語言包；manualLocale 為空表示跟隨 Obsidian 界面語言。 */
export function getStrings(manualLocale: string): EnStrings {
	const code = manualLocale || moment.locale() || "en";
	return LOCALES[code] ?? LOCALES[code.split("-")[0]] ?? en;
}

/** 設置頁語言下拉的選項。 */
export const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
	{ value: "", label: "" }, // label 在調用處以 common.languageAuto 填入
	{ value: "zh-tw", label: "繁體中文" },
	{ value: "ja", label: "日本語" },
	{ value: "en", label: "English" },
	{ value: "fr", label: "Français" },
	{ value: "de", label: "Deutsch" },
];
