// A fresh install: First run explains Atlas, asks which editor's shortcuts
// to use, and then gets out of the way.

import { expect, openScenario, sidebar, test } from "./fixtures";

test("walks a fresh install through First run", async ({ page }) => {
  await openScenario(page, "fresh-install");

  const welcome = page.getByRole("dialog", { name: "Welcome to Atlas" });
  await expect(welcome).toMatchAriaSnapshot(`
    - dialog "Welcome to Atlas":
      - heading "Welcome to Atlas" [level=2]
      - button "Continue"
  `);
  await welcome.getByRole("button", { name: "Continue" }).click();

  const keymap = page.getByRole("dialog", { name: "Which shortcuts should Atlas use?" });
  await expect(keymap).toBeVisible();
  await expect(keymap.getByRole("button", { name: /^VS Code/ })).toBeVisible();
  await expect(keymap.getByRole("button", { name: "Decide later" })).toBeVisible();
  await keymap.getByRole("button", { name: /^VS Code/ }).click();

  await expect(keymap).toBeHidden();
  await expect(sidebar(page)).toBeVisible();
});

test("First run can be put off", async ({ page }) => {
  await openScenario(page, "fresh-install");

  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Decide later" }).click();

  await expect(
    page.getByRole("dialog", { name: "Which shortcuts should Atlas use?" }),
  ).toBeHidden();
  await expect(sidebar(page)).toBeVisible();
});
