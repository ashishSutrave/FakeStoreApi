import { APIRequestContext, APIResponse } from '@playwright/test';
import { expect } from '@playwright/test';
import { getBaseUrl } from '../constants/endpoints';
import { ApiResponse, RequestOptions } from '../types/api.types';
import { getBrowserHeaders } from './browserHeaders';
import { logger } from './logger';

export const STRICT_RESPONSE_TIME_MS = Number(process.env.STRICT_RESPONSE_TIME_MS) || 2000;
export const MAX_RESPONSE_TIME_MS = Number(process.env.MAX_RESPONSE_TIME_MS) || 5000;

export class ApiHelper {
  static buildUrl(endpoint: string): string {
    return `${getBaseUrl()}${endpoint}`;
  }

  static async executeRequest(
    request: APIRequestContext,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse> {
    const url = this.buildUrl(endpoint);
    const headers = {
      ...getBrowserHeaders(getBaseUrl()),
      ...options.headers,
    };

    logger.logRequest(method, url, headers, options.data);

    const startTime = Date.now();
    let response: APIResponse;

    try {
      switch (method) {
        case 'GET':
          response = await request.get(url, { headers, params: options.params });
          break;
        case 'POST':
          response = await request.post(url, { headers, data: options.data });
          break;
        case 'PUT':
          response = await request.put(url, { headers, data: options.data });
          break;
        case 'DELETE':
          response = await request.delete(url, { headers });
          break;
        case 'PATCH':
          response = await request.patch(url, { headers, data: options.data });
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
    } catch (error) {
      logger.error(`Request failed: ${method} ${url}`, error);
      throw error;
    }

    const responseTimeMs = Date.now() - startTime;
    const body = await this.parseResponseBody(response);
    const responseHeaders = response.headers();

    logger.logResponse(url, response.status(), responseTimeMs, body, responseHeaders);

    return {
      status: response.status(),
      body,
      headers: responseHeaders,
      responseTimeMs,
    };
  }

  private static async parseResponseBody(response: APIResponse): Promise<unknown> {
    const contentType = response.headers()['content-type'] ?? '';
    const text = await response.text();

    if (!text) {
      return null;
    }

    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }

    return text;
  }

  static assertStatusCode(actual: number, expected: number): void {
    expect(actual, `Expected status code ${expected} but received ${actual}`).toBe(expected);
  }

  static assertResponseTime(responseTimeMs: number, maxMs: number = MAX_RESPONSE_TIME_MS): void {
    expect(
      responseTimeMs,
      `Response time ${responseTimeMs}ms exceeded maximum allowed ${maxMs}ms`
    ).toBeLessThanOrEqual(maxMs);
  }

  static assertTokenExists(body: unknown): void {
    expect(body).toBeTruthy();
    expect(body).toHaveProperty('token');
    const token = (body as { token: unknown }).token;
    expect(typeof token).toBe('string');
    expect((token as string).length).toBeGreaterThan(0);
  }

  static assertRequiredFields(body: Record<string, unknown>, fields: string[]): void {
    for (const field of fields) {
      expect(body, `Missing required field: ${field}`).toHaveProperty(field);
      expect(body[field], `Field '${field}' should not be null or undefined`).not.toBeNull();
      expect(body[field], `Field '${field}' should not be undefined`).not.toBeUndefined();
    }
  }

  static getCredentials(): { username: string; password: string } {
    const username = process.env.API_USERNAME;
    const password = process.env.API_PASSWORD;

    if (!username || !password) {
      throw new Error('API_USERNAME and API_PASSWORD environment variables must be defined');
    }

    return { username, password };
  }

  static sanitizeForSnapshot(data: unknown): unknown {
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeForSnapshot(item));
    }

    if (data !== null && typeof data === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        sanitized[key] = this.sanitizeForSnapshot(value);
      }
      return sanitized;
    }

    return data;
  }
}
