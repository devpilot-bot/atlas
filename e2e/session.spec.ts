// Sessions: reopening one from the sidebar, reading what it says, and writing
// to the agent.
//
// Northwind, not the default scenario: its org has an AI grant, so the Atlas
// Agent's composer is live, and its history rows reopen with their recorded
// transcripts (the default scenario's local-only org locks that composer by
// design, and its rows resume without history).

import { composer, expect, openScenario, sidebar, test } from "./fixtures";

test("opens a session from the sidebar and reads its transcript", async ({ page }) => {
  await openScenario(page, "northwind");

  await sidebar(page)
    .getByRole("button", { name: /^Move discount code validation to the server/ })
    .click();

  await expect(
    // The switcher truncates a long title, so match its start.
    page.getByRole("button", { name: /^Session: Move discount code validation/ }),
  ).toBeVisible();
  // The prompt, then the agent's answer and what it changed.
  await expect(
    page
      .getByRole("paragraph")
      .filter({ hasText: /^Move discount code validation to the server: create/ }),
  ).toBeVisible();
  await expect(page.getByText("Discount codes are now checked on the server.")).toBeVisible();
  await expect(page.getByRole("tree", { name: "Changed files" })).toBeVisible();
});

test("types in the composer and sends to the agent", async ({ page }) => {
  await openScenario(page, "northwind");
  const send = page.getByRole("button", { name: "Send message" });

  await composer(page).click();
  await expect(send).toBeDisabled();
  await page.keyboard.type("Rename the retry helper");
  await expect(send).toBeEnabled();
  await page.keyboard.press("Enter");

  // The prompt lands in the transcript, the field clears, and the agent answers.
  await expect(
    page.getByRole("paragraph").filter({ hasText: /^Rename the retry helper$/ }),
  ).toBeVisible();
  await expect(composer(page)).toHaveText("");
  await expect(
    page.getByText(/Before I change anything for "Rename the retry helper"/),
  ).toBeVisible();
});

test("a transcript's markdown renders as structure", async ({ page }) => {
  await openScenario(page, "chat-markdown");

  // Tables, lists and fenced code reach the accessibility tree as such, not
  // as a flat run of text.
  await expect(page.getByRole("table").first()).toMatchAriaSnapshot(`
    - table:
      - rowgroup:
        - row "col value":
          - columnheader "col"
          - columnheader "value"
      - rowgroup:
        - row "a 1"
        - row "b 2"
  `);
  await expect(page.getByRole("button", { name: "Copy code" }).first()).toBeVisible();
});
