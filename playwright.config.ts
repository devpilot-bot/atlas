import { defineConfig, devices } from "@playwright/test";

// End-to-end journeys over the browser mock backend (`src/dev/mock-backend/`).
// Every test opens the app at `?scenario=<name>`, so each one starts from a
// known fake world with fresh stores; `e2e/fixtures.ts` has the helpers.
//
// Two engines: Chromium, and WebKit as the stand-in for the WebViews Atlas
// really ships in (WKWebView on macOS, WebKitGTK on Linux). Neither is the
// shipped WebView, so a final look in `bun run dev:app` still decides.
//
// Port 1430, not Vite's 1420: `bun run dev:app` owns 1420. Never reuse a
// server already on 1430 either: it may be another checkout's (a second
// worktree's run), and the suite would test that code. Two runs at once
// fail loudly on `--strictPort` instead.

const PORT = 1430;

export default defineConfig({
  testDir: "e2e",
  // The suite shares one Vite server; its first page load compiles the app,
  // and two engines both compiling cold is the slowest part of a run.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // Locally, half the cores: the mock app is heavy and Vite serves both engines.
  workers: process.env.CI ? 2 : "50%",
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    // The mock badge and toasts animate; reduced motion keeps snapshots and
    // axe from sampling a mid-transition frame.
    reducedMotion: "reduce",
    colorScheme: "dark",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `bunx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
