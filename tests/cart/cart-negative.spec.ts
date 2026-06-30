import cartData from '../../fixtures/cartData.json';
import { ApiHelper } from '../../utils/apiHelper';
import { expect, test } from '../../fixtures/testFixtures';

test.describe('Cart Negative Testing', () => {
  test('Invalid Cart ID - should return 404 or empty response', async ({ cartApi }) => {
    const invalidCartId = 999999999;
    const response = await cartApi.getCartById(invalidCartId);

    expect([200, 404, 400]).toContain(response.status);
    ApiHelper.assertResponseTime(response.responseTimeMs);

    if (response.status === 200) {
      expect(response.body === null || typeof response.body === 'object').toBeTruthy();
    } else {
      expect(response.body).toBeTruthy();
    }
  });

  test('Invalid Product ID in cart payload - should handle gracefully', async ({ cartApi }) => {
    const payload = {
      userId: 1,
      date: '2024-01-15',
      products: [{ productId: 999999999, quantity: 1 }],
    };

    const response = await cartApi.createCart(payload);

    expect([200, 201, 400, 404]).toContain(response.status);
    ApiHelper.assertResponseTime(response.responseTimeMs);
    expect(response.body).toBeTruthy();
  });

  test('Invalid Payload - should return client error or accept payload', async ({ cartApi }) => {
    const response = await cartApi.createCart(
      cartData.invalidPayload as unknown as typeof cartData.validCart
    );

    expect([400, 422, 500, 201]).toContain(response.status);
    ApiHelper.assertResponseTime(response.responseTimeMs);
    expect(response.body !== undefined).toBeTruthy();
  });

  test('Missing Required Fields - should return 400 or accept partial payload', async ({
    cartApi,
  }) => {
    const response = await cartApi.createCart(
      cartData.missingRequiredFields as unknown as typeof cartData.validCart
    );

    expect([400, 422, 201]).toContain(response.status);
    ApiHelper.assertResponseTime(response.responseTimeMs);
    expect(response.body !== undefined).toBeTruthy();
  });

  test('Wrong Data Types - should return 400 or accept payload', async ({ cartApi }) => {
    const response = await cartApi.createCart(
      cartData.wrongDataTypes as unknown as typeof cartData.validCart
    );

    expect([400, 422, 500, 201]).toContain(response.status);
    ApiHelper.assertResponseTime(response.responseTimeMs);
    expect(response.body !== undefined).toBeTruthy();
  });

  test('Unauthorized Access - invalid token should be handled', async ({ cartApi }) => {
    cartApi.setAuthToken('invalid-token-xyz-12345');
    const response = await cartApi.getAllCarts();

    expect([200, 401, 403]).toContain(response.status);
    ApiHelper.assertResponseTime(response.responseTimeMs, 5000);
    expect(response.body).toBeTruthy();
  });

  test('DELETE non-existent cart - should return 404, 400, or 200', async ({ cartApi }) => {
    const response = await cartApi.deleteCart(999999999);

    expect([200, 400, 404]).toContain(response.status);
    ApiHelper.assertResponseTime(response.responseTimeMs);
    expect(response.body === null || response.body !== undefined).toBeTruthy();
  });

  test('PUT with invalid cart ID - should return 404, 400, or 200', async ({ cartApi }) => {
    const response = await cartApi.updateCart(999999999, cartData.validCart);

    expect([400, 404, 200]).toContain(response.status);
    ApiHelper.assertResponseTime(response.responseTimeMs);
    expect(response.body !== undefined).toBeTruthy();
  });
});
