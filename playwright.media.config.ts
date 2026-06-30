import { defineConfig, devices } from "@playwright/test";

process.env.PLAYWRIGHT_BROWSERS_PATH ??= "0";

export default defineConfig({
  fullyParallel: false,
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { height: 1000, width: 1440 },
      },
    },
  ],
  reporter: "list",
  testDir: "./scripts/media",
  timeout: 120_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
    video: {
      mode: "on",
      size: { height: 1000, width: 1440 },
    },
    viewport: { height: 1000, width: 1440 },
  },
  webServer: {
    command: "pnpm dev",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: "http://localhost:3000",
  },
});
