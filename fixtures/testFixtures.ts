import { APIRequestContext, Browser, test as base } from '@playwright/test';
import { AuthApi } from '../api/AuthApi';
import { CartApi } from '../api/CartApi';
import { ProductApi } from '../api/ProductApi';
import { getBaseUrl } from '../constants/endpoints';
import { CHROME_USER_AGENT, getBrowserHeaders } from '../utils/browserHeaders';
import { createCloudflareAwareRequest } from '../utils/cloudflareWarmup';

type CloudflareSession = {
  browser: Browser;
  request: APIRequestContext;
};

type WorkerFixtures = {
  cloudflareSession: CloudflareSession | null;
};

type ApiFixtures = {
  apiRequest: APIRequestContext;
  authApi: AuthApi;
  cartApi: CartApi;
  productApi: ProductApi;
  authenticatedCartApi: CartApi;
  authenticatedProductApi: ProductApi;
};

export const test = base.extend<ApiFixtures, WorkerFixtures>({
  cloudflareSession: [
    async ({ playwright: _playwright }, use) => {
      if (!process.env.CI) {
        await use(null);
        return;
      }

      const origin = getBaseUrl();
      const session = await createCloudflareAwareRequest(origin);
      await use(session);
      await session.browser.close();
    },
    { scope: 'worker' },
  ],

  apiRequest: async ({ playwright, cloudflareSession }, use) => {
    if (cloudflareSession) {
      await use(cloudflareSession.request);
      return;
    }

    const origin = getBaseUrl();
    const apiContext = await playwright.request.newContext({
      baseURL: origin,
      userAgent: CHROME_USER_AGENT,
      extraHTTPHeaders: getBrowserHeaders(origin),
    });
    await use(apiContext);
    await apiContext.dispose();
  },

  authApi: async ({ apiRequest }, use) => {
    await use(new AuthApi(apiRequest));
  },

  cartApi: async ({ apiRequest }, use) => {
    await use(new CartApi(apiRequest));
  },

  productApi: async ({ apiRequest }, use) => {
    await use(new ProductApi(apiRequest));
  },

  authenticatedCartApi: async ({ apiRequest, authApi }, use) => {
    const response = await authApi.loginWithEnvCredentials();
    const cartApi = new CartApi(apiRequest);
    if (response.body?.token) {
      cartApi.setAuthToken(response.body.token);
    }
    await use(cartApi);
  },

  authenticatedProductApi: async ({ apiRequest, authApi }, use) => {
    const response = await authApi.loginWithEnvCredentials();
    const productApi = new ProductApi(apiRequest);
    if (response.body?.token) {
      productApi.setAuthToken(response.body.token);
    }
    await use(productApi);
  },
});

export { expect } from '@playwright/test';
