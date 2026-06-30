import cartData from '../../fixtures/cartData.json';
import { Cart, CreateCartPayload } from '../../types/api.types';
import { ApiHelper, STRICT_RESPONSE_TIME_MS } from '../../utils/apiHelper';
import { SchemaValidator } from '../../utils/schemaValidator';
import { expect, test } from '../../fixtures/testFixtures';

const SEEDED_CART_ID = 1;

test.describe('Cart CRUD Operations', () => {
  test('POST Cart - should create a new cart', async ({ cartApi }) => {
    const payload = cartData.validCart as CreateCartPayload;
    const response = await cartApi.createCart(payload);

    ApiHelper.assertStatusCode(response.status, 201);
    ApiHelper.assertResponseTime(response.responseTimeMs, STRICT_RESPONSE_TIME_MS);
    SchemaValidator.assertValid('cart', response.body);

    const body = response.body as Cart;
    ApiHelper.assertRequiredFields(body as unknown as Record<string, unknown>, [
      'id',
      'userId',
      'products',
    ]);
    expect(body.userId).toBe(payload.userId);
    expect(body.products).toHaveLength(payload.products.length);
    expect(body.products[0].productId).toBe(payload.products[0].productId);
  });

  test('GET Cart - should retrieve cart by ID', async ({ cartApi }) => {
    const response = await cartApi.getCartById(SEEDED_CART_ID);

    ApiHelper.assertStatusCode(response.status, 200);
    ApiHelper.assertResponseTime(response.responseTimeMs, STRICT_RESPONSE_TIME_MS);
    expect(response.body).toBeTruthy();
    SchemaValidator.assertValid('cart', response.body);

    const body = response.body as Cart;
    ApiHelper.assertRequiredFields(body as unknown as Record<string, unknown>, [
      'id',
      'userId',
      'products',
    ]);
    expect(body.id).toBe(SEEDED_CART_ID);
  });

  test('PUT Cart - should update an existing cart', async ({ cartApi }) => {
    const createResponse = await cartApi.createCart(cartData.validCart as CreateCartPayload);
    const cartId = (createResponse.body as Cart).id;
    const updatePayload = cartData.updatedCart as CreateCartPayload;

    const response = await cartApi.updateCart(cartId, updatePayload);

    ApiHelper.assertStatusCode(response.status, 200);
    ApiHelper.assertResponseTime(response.responseTimeMs, STRICT_RESPONSE_TIME_MS);
    SchemaValidator.assertValid('cart', response.body);

    const body = response.body as Cart;
    ApiHelper.assertRequiredFields(body as unknown as Record<string, unknown>, [
      'id',
      'userId',
      'products',
    ]);
    expect(body.id).toBe(cartId);
    expect(body.userId).toBe(updatePayload.userId);
    expect(body.products).toHaveLength(updatePayload.products.length);
  });

  test('DELETE Cart - should delete an existing cart', async ({ cartApi }) => {
    const createResponse = await cartApi.createCart(cartData.validCart as CreateCartPayload);
    const cartId = (createResponse.body as Cart).id;

    const response = await cartApi.deleteCart(cartId);

    ApiHelper.assertStatusCode(response.status, 200);
    ApiHelper.assertResponseTime(response.responseTimeMs, STRICT_RESPONSE_TIME_MS);

    if (response.body && typeof response.body === 'object') {
      SchemaValidator.assertValid('cart', response.body);
    }
  });
});

test.describe('Cart Authentication', () => {
  test('Authenticated access - valid token should fetch carts', async ({ authenticatedCartApi }) => {
    const response = await authenticatedCartApi.getAllCarts();

    ApiHelper.assertStatusCode(response.status, 200);
    ApiHelper.assertResponseTime(response.responseTimeMs, STRICT_RESPONSE_TIME_MS);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect((response.body as Cart[]).length).toBeGreaterThan(0);
  });
});
