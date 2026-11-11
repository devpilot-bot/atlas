// Shared setup for the end-to-end suite.
//
// Isolation comes from Playwright, not from the mock: every test gets a new
// browser context, so a new document, new module singletons (every Zustand
// store included) and empty storage. `openScenario` then picks the fake world
// through `?scenario=`. That is why nothing here calls
// `__atlasMock.resetStores()`: it exists for many renders in ONE document (a
// Storybook decorator), and a test here never shares a document.

import { expect, test as base, type Page } from "@playwright/test";

export { expect };

export const test = base.extend<{ pageErrors: string[] }>({
  // An uncaught exception or unhandled rejection fails the test that caused
  // it, even when the screen still looks right: a thrown handler is a broken
  // journey whether or not the assertion that follows happens to notice.
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use(errors);
      expect(errors, "uncaught errors in the page").toEqual([]);
    },
    { auto: true },
  ],
});

/**
 * Open the app on a mock scenario and wait for the fake backend to answer.
 * The mock badge names the scenario once `backend.ts` has loaded it, so
 * seeing it means every command from here on is answered by that scenario.
 */
export async function openScenario(page: Page, scenario: string): Promise<void> {
  await page.goto(`/?scenario=${scenario}`);
  // Generous: on a cold Vite server the first load compiles the whole app.
  // The badge reads `mock · <scenario>` and then, when there are any, the
  // unmocked count; anchor both ends so `chat-comments` never matches
  // `chat-comments-many`.
  const badge = page.getByText(new RegExp(`^mock · ${scenario}(?: ·|$)`));
  await expect(badge).toBeVisible({ timeout: 45_000 });
}

/** The left sidebar: every scenario but a first run boots into it. */
export function sidebar(page: Page) {
  return page.getByRole("complementary");
}

/** The session composer's text field. */
export function composer(page: Page) {
  return page.getByRole("textbox", { name: "Chat message" });
}

/**
 * The modifier Atlas's shortcuts use on the platform the page reports:
 * Meta (⌘) under a macOS user agent, Control otherwise. Atlas reads the
 * platform off the user agent (`src/lib/platform.ts`), while Playwright's
 * `ControlOrMeta` follows the machine running the test, so WebKit's macOS
 * profile on a Linux runner would get Control and miss every ⌘ shortcut.
 */
export async function mod(page: Page): Promise<"Meta" | "Control"> {
  const mac = await page.evaluate(() => navigator.userAgent.includes("Macintosh"));
  return mac ? "Meta" : "Control";
}
