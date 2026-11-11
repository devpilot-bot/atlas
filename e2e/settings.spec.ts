// Settings: open it, change a setting, and the change holds while moving
// between sections.

import { composer, expect, mod, openScenario, test } from "./fixtures";

test("opens Settings and changes a setting", async ({ page }) => {
  await openScenario(page, "default");
  await expect(composer(page)).toBeVisible();

  await page.keyboard.press(`${await mod(page)}+,`);
  const sections = page.getByRole("navigation", { name: "Settings sections" });
  await expect(page.getByRole("heading", { name: "General", level: 1 })).toBeVisible();
  await expect(sections).toMatchAriaSnapshot(`
    - navigation "Settings sections":
      - combobox "Search settings"
      - button "General"
      - button "Appearance"
      - button "Keybindings"
      - button "Back to the workspace"
  `);

  const hidden = page.getByRole("switch", { name: "Files: Show hidden files" });
  await expect(hidden).toBeChecked();
  await hidden.click();
  await expect(hidden).not.toBeChecked();

  // Away and back: the section re-reads the setting, not the switch's own state.
  await sections.getByRole("button", { name: "Appearance" }).click();
  await expect(page.getByRole("heading", { name: "Appearance", level: 1 })).toBeVisible();
  await sections.getByRole("button", { name: "General" }).click();
  await expect(page.getByRole("switch", { name: "Files: Show hidden files" })).not.toBeChecked();

  await sections.getByRole("button", { name: "Back to the workspace" }).click();
  await expect(sections).toBeHidden();
  await expect(composer(page)).toBeVisible();
});
