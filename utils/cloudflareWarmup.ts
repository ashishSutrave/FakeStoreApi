import {
  chromium,
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  type LaunchOptions,
  type Page,
} from '@playwright/test';
import fs from 'fs';
import { CLOUDFLARE_STORAGE_PATH } from '../constants/storage';
import { getBrowserHeaders, getNavigationContextOptions } from './browserHeaders';

const CHALLENGE_TIMEOUT_MS = 90_000;

const LAUNCH_OPTIONS: LaunchOptions = {
  headless: false,
  args: [
    '--disable-blink-features=AutomationControlled',
    '--no-sandbox',
    '--disable-dev-shm-usage',
  ],
  ignoreDefaultArgs: ['--enable-automation'],
};

async function waitForChallengeToClear(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () =>
        !document.title.includes('Just a moment') &&
        !document.body?.innerText?.includes('Checking your browser'),
      undefined,
      { timeout: CHALLENGE_TIMEOUT_MS }
    )
    .catch(() => undefined);

  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
}

async function waitForClearanceCookie(context: BrowserContext): Promise<void> {
  const deadline = Date.now() + CHALLENGE_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const cookies = await context.cookies();
    if (cookies.some((cookie) => cookie.name === 'cf_clearance')) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
}

async function warmupContext(context: BrowserContext, origin: string): Promise<void> {
  const page = await context.newPage();

  try {
    await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: CHALLENGE_TIMEOUT_MS });
    await waitForChallengeToClear(page);
    await waitForClearanceCookie(context);

    await page.goto(`${origin}/products/1`, {
      waitUntil: 'domcontentloaded',
      timeout: CHALLENGE_TIMEOUT_MS,
    });
    await waitForChallengeToClear(page);
  } finally {
    await page.close();
  }
}

async function assertApiAccess(request: APIRequestContext, origin: string): Promise<void> {
  const response = await request.get(`${origin}/products/1`, {
    headers: getBrowserHeaders(origin),
  });

  if (response.status() === 403) {
    throw new Error('Cloudflare challenge was not bypassed for API requests.');
  }
}

export async function createCloudflareAwareRequest(
  origin: string
): Promise<{ request: APIRequestContext; browser: Browser }> {
  const browser = await chromium.launch(LAUNCH_OPTIONS);
  const hasStorage = fs.existsSync(CLOUDFLARE_STORAGE_PATH);

  const context = await browser.newContext({
    ...(hasStorage ? { storageState: CLOUDFLARE_STORAGE_PATH } : {}),
    ...getNavigationContextOptions(),
  });

  try {
    await warmupContext(context, origin);
    await assertApiAccess(context.request, origin);
    return { request: context.request, browser };
  } catch (error) {
    await browser.close();
    throw error;
  }
}
