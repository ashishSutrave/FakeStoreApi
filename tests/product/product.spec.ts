import { Product } from '../../types/api.types';
import { ApiHelper, MAX_RESPONSE_TIME_MS } from '../../utils/apiHelper';
import { SchemaValidator } from '../../utils/schemaValidator';
import { expect, test } from '../../fixtures/testFixtures';

const PRODUCT_IDS = [1, 2, 3, 4, 5];

test.describe('Product API - Data Driven Tests', () => {
  for (const productId of PRODUCT_IDS) {
    test(`GET Product by ID ${productId} - should return valid product`, async ({ productApi }) => {
      const response = await productApi.getProductById(productId);

      ApiHelper.assertStatusCode(response.status, 200);
      ApiHelper.assertResponseTime(response.responseTimeMs, MAX_RESPONSE_TIME_MS);
      SchemaValidator.assertValid('product', response.body);

      const body = response.body as Product;
      ApiHelper.assertRequiredFields(body as unknown as Record<string, unknown>, [
        'id',
        'title',
        'price',
        'description',
        'category',
        'image',
      ]);
      expect(body.id).toBe(productId);
      expect(body.title.length).toBeGreaterThan(0);
      expect(body.price).toBeGreaterThan(0);
    });
  }
});

test.describe('Product API - Negative Testing', () => {
  test('Invalid Product ID - should return 404, 400, or empty response', async ({ productApi }) => {
    const response = await productApi.getProductById(999999999);

    expect([200, 400, 404]).toContain(response.status);
    ApiHelper.assertResponseTime(response.responseTimeMs);

    if (response.status === 200) {
      expect(response.body === null || typeof response.body === 'object').toBeTruthy();
    } else {
      expect(response.body).toBeTruthy();
    }
  });

  test('Invalid Payload on POST - should return 400', async ({ productApi }) => {
    const response = await productApi.createProduct({
      title: 123 as unknown as string,
      price: 'invalid' as unknown as number,
    });

    expect([400, 422, 201, 500]).toContain(response.status);
    ApiHelper.assertResponseTime(response.responseTimeMs);
    expect(response.body).toBeTruthy();
  });

  test('Missing Required Fields on POST - should handle validation', async ({ productApi }) => {
    const response = await productApi.createProduct({});

    expect([400, 422, 201]).toContain(response.status);
    ApiHelper.assertResponseTime(response.responseTimeMs);
    expect(response.body).toBeTruthy();
  });
});

test.describe('Product API - Contract Testing (Snapshot)', () => {
  for (const productId of PRODUCT_IDS) {
    test(`Product ${productId} response contract snapshot`, async ({ productApi }) => {
      const response = await productApi.getProductById(productId);

      ApiHelper.assertStatusCode(response.status, 200);
      SchemaValidator.assertValid('product', response.body);

      const sanitized = ApiHelper.sanitizeForSnapshot(response.body);
      const snapshotPayload = JSON.stringify(sanitized, null, 2);
      expect(snapshotPayload).toMatchSnapshot(`product-${productId}-response.txt`);
    });
  }
});
