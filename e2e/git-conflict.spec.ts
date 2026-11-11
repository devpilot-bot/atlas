// A merge stopped on conflicts: Source control shows the merge in progress,
// each conflicted file with its resolutions, and resolving one removes it.

import { expect, openScenario, sidebar, test } from "./fixtures";

test("shows the conflict UI and resolves a file", async ({ page }) => {
  await openScenario(page, "git-conflict");

  await sidebar(page).getByRole("button", { name: "Source control" }).click();

  await expect(page.getByText("Resolving merge")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Abort" })).toBeVisible();
  await expect(page.getByText("Conflicts (3)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Resolve with agent" })).toBeVisible();

  // One Ours / Theirs pair per conflicted file.
  await expect(page.getByRole("button", { name: "Ours", exact: true })).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Theirs", exact: true })).toHaveCount(3);

  await page.getByRole("button", { name: "Ours", exact: true }).first().click();

  await expect(page.getByText("Conflicts (2)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ours", exact: true })).toHaveCount(2);
});
