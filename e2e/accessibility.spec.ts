// axe over every scenario as it boots, and over the surfaces only a journey
// reaches. The rules and the allowlist are in `a11y.ts`.

import type { Page } from "@playwright/test";
import { expectNoNewViolations } from "./a11y";
import { composer, expect, mod, openScenario, sidebar, test } from "./fixtures";

const BOOTED: { scenario: string; ready: (p: Page) => Promise<void> }[] = [
  { scenario: "default", ready: (p) => expect(composer(p)).toBeVisible() },
  {
    scenario: "fresh-install",
    ready: (p) => expect(p.getByRole("dialog", { name: "Welcome to Atlas" })).toBeVisible(),
  },
  { scenario: "git-conflict", ready: (p) => expect(composer(p)).toBeVisible() },
  {
    scenario: "northwind",
    ready: (p) => expect(p.getByRole("button", { name: "Copy response" }).first()).toBeVisible(),
  },
  {
    scenario: "chat-markdown",
    ready: (p) => expect(p.getByRole("table").first()).toBeVisible(),
  },
  { scenario: "chat-tools", ready: (p) => expect(composer(p)).toBeVisible() },
  {
    scenario: "sidebar",
    ready: (p) => expect(sidebar(p).getByRole("list", { name: "Active sessions" })).toBeVisible(),
  },
  { scenario: "inbox-long", ready: (p) => expect(composer(p)).toBeVisible() },
  { scenario: "memory-populated", ready: (p) => expect(composer(p)).toBeVisible() },
  { scenario: "knowledge", ready: (p) => expect(composer(p)).toBeVisible() },
];

test.describe("axe, per scenario", () => {
  for (const { scenario, ready } of BOOTED) {
    test(scenario, async ({ page }, testInfo) => {
      await openScenario(page, scenario);
      await ready(page);
      await expectNoNewViolations(page, scenario, testInfo);
    });
  }
});

test.describe("axe, per surface", () => {
  test("command palette", async ({ page }, testInfo) => {
    await openScenario(page, "default");
    await expect(composer(page)).toBeVisible();
    await page.keyboard.press(`${await mod(page)}+k`);
    await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
    await expectNoNewViolations(page, "command-palette", testInfo);
  });

  test("settings", async ({ page }, testInfo) => {
    await openScenario(page, "default");
    await expect(composer(page)).toBeVisible();
    await page.keyboard.press(`${await mod(page)}+,`);
    await expect(page.getByRole("heading", { name: "General", level: 1 })).toBeVisible();
    await expectNoNewViolations(page, "settings", testInfo);
  });

  test("source control, mid-merge", async ({ page }, testInfo) => {
    await openScenario(page, "git-conflict");
    await sidebar(page).getByRole("button", { name: "Source control" }).click();
    await expect(page.getByText("Resolving merge")).toBeVisible();
    await expectNoNewViolations(page, "source-control", testInfo);
  });
});
