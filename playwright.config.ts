import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import { CLOUDFLARE_STORAGE_PATH } from './constants/storage';
import { CHROME_USER_AGENT, getBrowserHeaders } from './utils/browserHeaders';

dotenv.config({ override: true });

const baseURL = (process.env.BASE_URL || 'https://fakestoreapi.com').replace(/\/$/, '');

const workers = process.env.WORKERS
  ? Number(process.env.WORKERS)
  : process.env.CI
    ? 1
    : undefined;

export default defineConfig({
  globalSetup: require.resolve('./global-setup'),
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers,
  timeout: 30000,
  expect: {
    timeout: 10000,
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL,
    userAgent: CHROME_USER_AGENT,
    storageState: CLOUDFLARE_STORAGE_PATH,
    extraHTTPHeaders: getBrowserHeaders(baseURL),
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'api-tests',
      testMatch: '**/*.spec.ts',
    },
  ],
});
