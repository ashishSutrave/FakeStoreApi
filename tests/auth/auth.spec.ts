import loginData from '../../fixtures/loginData.json';
import { LoginResponse } from '../../types/api.types';
import { ApiHelper } from '../../utils/apiHelper';
import { SchemaValidator } from '../../utils/schemaValidator';
import { expect, test } from '../../fixtures/testFixtures';

test.describe('Authentication API', () => {
  test('Valid Login - should return token with success status', async ({ authApi }) => {
    const credentials = ApiHelper.getCredentials();
    const response = await authApi.login(credentials);

    ApiHelper.assertStatusCode(response.status, 201);
    ApiHelper.assertResponseTime(response.responseTimeMs);
    ApiHelper.assertTokenExists(response.body);
    SchemaValidator.assertValid('login', response.body);

    const body = response.body as LoginResponse;
    expect(body.token).toBeTruthy();
    expect(typeof body.token).toBe('string');
  });

  test('Invalid Username - should reject login', async ({ authApi }) => {
    const response = await authApi.login(loginData.invalidUsername);

    expect([400, 401]).toContain(response.status);
    ApiHelper.assertResponseTime(response.responseTimeMs);
    expect(response.body).toBeTruthy();
  });

  test('Invalid Password - should reject login', async ({ authApi }) => {
    const response = await authApi.login(loginData.invalidPassword);

    expect([400, 401]).toContain(response.status);
    ApiHelper.assertResponseTime(response.responseTimeMs);
    expect(response.body).toBeTruthy();
  });

  test('Empty Username - should reject login', async ({ authApi }) => {
    const response = await authApi.login(loginData.emptyUsername);

    expect([400, 401, 422]).toContain(response.status);
    ApiHelper.assertResponseTime(response.responseTimeMs);
    expect(response.body).toBeTruthy();
  });

  test('Empty Password - should reject login', async ({ authApi }) => {
    const response = await authApi.login(loginData.emptyPassword);

    expect([400, 401, 422]).toContain(response.status);
    ApiHelper.assertResponseTime(response.responseTimeMs);
    expect(response.body).toBeTruthy();
  });
});
