// The app boots on the default scenario into the whole shell: sidebar,
// titlebar, and a new session's composer.

import { composer, expect, openScenario, sidebar, test } from "./fixtures";

test("boots on the default scenario into the shell", async ({ page }) => {
  await openScenario(page, "default");

  await expect(composer(page)).toBeVisible();
  await expect(page.getByRole("heading", { name: "What are we building?" })).toBeVisible();

  // Coarse on purpose: landmarks and the controls a user navigates by, not
  // session titles or counts, which every fixture tweak would churn.
  await expect(sidebar(page)).toMatchAriaSnapshot(`
    - complementary:
      - button "Search"
      - navigation "Destinations":
        - button "Inbox"
        - button "Team chat"
        - button "Timeline"
        - button "Agent"
      - combobox "Search sessions"
      - list "Pinned sessions"
      - list "Active sessions"
      - navigation "Sidebar tools":
        - button "Memory"
        - button "Knowledge"
        - button "Source control"
        - button "Usage"
        - button "Notifications"
  `);
});

test("the sidebar's session search finds and opens a session", async ({ page }) => {
  await openScenario(page, "default");
  const search = sidebar(page).getByRole("combobox", { name: "Search sessions" });

  await search.fill("PDF highlight");

  const results = sidebar(page).getByRole("listbox", { name: "Search results" });
  await expect(results.getByRole("option")).toHaveCount(1);
  await expect(
    results.getByRole("option", { name: /^Why does the PDF highlight drift/ }),
  ).toBeVisible();
  await search.press("Enter");

  await expect(
    page.getByRole("button", { name: /^Session: Why does the PDF highlight drift/ }),
  ).toBeVisible();
});

test("a destination opens from the sidebar and Esc goes back", async ({ page }) => {
  await openScenario(page, "default");
  await sidebar(page)
    .getByRole("navigation", { name: "Destinations" })
    .getByRole("button", { name: "Inbox" })
    .click();

  const back = page.getByRole("button", { name: "Back to the session (Esc)" });
  await expect(back).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Show" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(back).toBeHidden();
  await expect(composer(page)).toBeVisible();
});
