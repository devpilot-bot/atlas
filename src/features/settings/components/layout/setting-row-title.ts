import { createContext, useContext } from "react";
import type { AppSettings } from "../../lib/app-settings";
import { settingMeta } from "../../lib/settings-sections";

/** The title a `SettingsRow` shows, for the controls inside it. */
export const SettingRowTitle = createContext<string | undefined>(undefined);

/**
 * A bound control's accessible name: the label written next to it, so a
 * voice or agent user can name the control by what they see (WCAG 2.5.3).
 * The registry's title stands in outside a row, or when the row's title is
 * not plain text.
 */
export function useSettingName(setting: keyof AppSettings): string {
  return useContext(SettingRowTitle) ?? settingMeta(setting).title;
}
