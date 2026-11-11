// The command palette: ⌘K (Ctrl+K off macOS) opens it, typing filters it,
// and Enter runs the selected action.

import { composer, expect, mod, openScenario, test } from "./fixtures";

test("opens with ⌘K and runs an action", async ({ page }) => {
  await openScenario(page, "default");
  await expect(composer(page)).toBeVisible();

  await page.keyboard.press(`${await mod(page)}+k`);
  const palette = page.getByRole("dialog", { name: "Command palette" });
  await expect(palette).toBeVisible();
  await expect(palette).toMatchAriaSnapshot(`
    - dialog "Command palette":
      - combobox "Search commands, projects, and sessions…"
      - listbox:
        - option /New session in acme-app/
  `);

  await palette.getByRole("combobox").fill("Open settings");
  await expect(palette.getByRole("option", { name: /^Open settings/ })).toBeVisible();
  await page.keyboard.press("Enter");

  await expect(palette).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Settings sections" })).toBeVisible();
});

test("Escape closes it without running anything", async ({ page }) => {
  await openScenario(page, "default");
  await expect(composer(page)).toBeVisible();

  await page.keyboard.press(`${await mod(page)}+k`);
  const palette = page.getByRole("dialog", { name: "Command palette" });
  await expect(palette).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(palette).toBeHidden();
  await expect(composer(page)).toBeVisible();
});
