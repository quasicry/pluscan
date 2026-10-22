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

// 兼容性判定：包一層 requireApiVersion，使其在測試環境可注入。
import { requireApiVersion, Platform } from "obsidian";

export function requireApiVersionSafe(minAppVersion: string): boolean {
	try {
		return requireApiVersion(minAppVersion);
	} catch {
		return false;
	}
}

/** 移動端兼容判定：isDesktopOnly 插件在手機/平板上不可用。 */
export function isDesktopCompatible(isDesktopOnly?: boolean): boolean {
	return !(Platform.isMobile && isDesktopOnly === true);
}
