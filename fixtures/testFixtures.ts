import { test as base } from '@playwright/test';
import { AuthApi } from '../api/AuthApi';
import { CartApi } from '../api/CartApi';
import { ProductApi } from '../api/ProductApi';

type ApiFixtures = {
  authApi: AuthApi;
  cartApi: CartApi;
  productApi: ProductApi;
  authenticatedCartApi: CartApi;
  authenticatedProductApi: ProductApi;
};

export const test = base.extend<ApiFixtures>({
  authApi: async ({ request }, use) => {
    await use(new AuthApi(request));
  },

  cartApi: async ({ request }, use) => {
    await use(new CartApi(request));
  },

  productApi: async ({ request }, use) => {
    await use(new ProductApi(request));
  },

  authenticatedCartApi: async ({ request, authApi }, use) => {
    const response = await authApi.loginWithEnvCredentials();
    const cartApi = new CartApi(request);
    if (response.body?.token) {
      cartApi.setAuthToken(response.body.token);
    }
    await use(cartApi);
  },

  authenticatedProductApi: async ({ request, authApi }, use) => {
    const response = await authApi.loginWithEnvCredentials();
    const productApi = new ProductApi(request);
    if (response.body?.token) {
      productApi.setAuthToken(response.body.token);
    }
    await use(productApi);
  },
});

export { expect } from '@playwright/test';
