import mockData from '../fixtures/mockApiData.json';
import { RequestOptions } from '../types/api.types';

let nextCartId = 10;

type JsonBody = Record<string, unknown>;

type MockResult = {
  status: number;
  body: unknown;
};

function getExpectedCredentials(): { username: string; password: string } {
  return {
    username: process.env.API_USERNAME || 'mor_2314',
    password: process.env.API_PASSWORD || '83r5^_',
  };
}

function parseBody(data: unknown): JsonBody | null {
  if (!data || typeof data !== 'object') return null;
  return data as JsonBody;
}

function isValidLogin(body: JsonBody | null): boolean {
  if (!body) return false;
  const expected = getExpectedCredentials();
  return body.username === expected.username && body.password === expected.password;
}

function isInvalidLoginAttempt(body: JsonBody | null): boolean {
  if (!body) return true;
  const username = String(body.username ?? '');
  const password = String(body.password ?? '');
  return username.length > 0 && password.length > 0 && !isValidLogin(body);
}

function isCartPayloadInvalid(body: JsonBody | null): boolean {
  if (!body) return true;
  if (typeof body.userId === 'string') return true;
  if (typeof body.products === 'string') return true;
  if (body.userId === undefined && body.products === undefined) return true;
  return false;
}

function handleLogin(data: unknown): MockResult {
  const body = parseBody(data);

  if (!body?.username || !body?.password) {
    return { status: 400, body: 'username and password are not provided in JSON format' };
  }

  if (isValidLogin(body)) {
    return { status: 201, body: { token: mockData.mockToken } };
  }

  if (isInvalidLoginAttempt(body)) {
    return { status: 401, body: 'Invalid credentials' };
  }

  return { status: 400, body: 'username and password are not provided in JSON format' };
}

function handleProduct(path: string, method: string, data?: unknown): MockResult | null {
  const productMatch = path.match(/^\/products\/(\d+)$/);

  if (method === 'GET' && productMatch) {
    const id = productMatch[1];
    const product = mockData.products[id as keyof typeof mockData.products];
    if (!product) {
      return { status: 404, body: { message: 'Product not found' } };
    }
    return { status: 200, body: product };
  }

  if (method === 'POST' && path === '/products') {
    const body = parseBody(data);
    const invalidTypes =
      body &&
      (typeof body.title === 'number' ||
        typeof body.price === 'string' ||
        Object.keys(body).length === 0);

    if (invalidTypes || isCartPayloadInvalid(body)) {
      return { status: 400, body: { message: 'Invalid product payload' } };
    }

    return { status: 201, body: { id: 99, ...body } };
  }

  return null;
}

function handleCart(
  path: string,
  method: string,
  data?: unknown,
  headers?: Record<string, string>
): MockResult | null {
  const cartMatch = path.match(/^\/carts(?:\/(\d+))?$/);
  if (!cartMatch) return null;

  const cartId = cartMatch[1];

  if (method === 'GET' && path === '/carts') {
    const auth = headers?.Authorization || headers?.authorization;
    if (auth?.includes('invalid-token')) {
      return { status: 401, body: { message: 'Unauthorized' } };
    }
    return { status: 200, body: [mockData.seededCart] };
  }

  if (method === 'GET' && cartId) {
    if (cartId === '999999999') {
      return { status: 404, body: { message: 'Cart not found' } };
    }
    if (cartId === '1') {
      return { status: 200, body: mockData.seededCart };
    }
    return { status: 200, body: { ...mockData.seededCart, id: Number(cartId) } };
  }

  if (method === 'POST' && path === '/carts') {
    const body = parseBody(data);
    if (isCartPayloadInvalid(body)) {
      return { status: 400, body: { message: 'Invalid cart payload' } };
    }
    const id = nextCartId++;
    return { status: 201, body: { id, ...body } };
  }

  if (method === 'PUT' && cartId) {
    if (cartId === '999999999') {
      return { status: 404, body: { message: 'Cart not found' } };
    }
    const body = parseBody(data);
    return { status: 200, body: { id: Number(cartId), ...body } };
  }

  if (method === 'DELETE' && cartId) {
    if (cartId === '999999999') {
      return { status: 404, body: { message: 'Cart not found' } };
    }
    return { status: 200, body: { ...mockData.seededCart, id: Number(cartId) } };
  }

  return null;
}

export function executeMockRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  options: RequestOptions = {}
): MockResult {
  const path = endpoint.split('?')[0];

  if (path === '/auth/login' && method === 'POST') {
    return handleLogin(options.data);
  }

  const productResult = handleProduct(path, method, options.data);
  if (productResult) return productResult;

  const cartResult = handleCart(path, method, options.data, options.headers);
  if (cartResult) return cartResult;

  return { status: 404, body: { message: 'Not found' } };
}
