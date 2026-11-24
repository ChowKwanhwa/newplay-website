import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  workers: 2,
  timeout: 45_000,
  use: {
    baseURL: 'http://127.0.0.1:4383',
    channel: 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4383 --ignore-lock',
    url: 'http://127.0.0.1:4383',
    reuseExistingServer: false,
  },
});
