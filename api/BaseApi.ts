import { APIRequestContext } from '@playwright/test';
import { Endpoints } from '../constants/endpoints';
import { ApiResponse, RequestOptions } from '../types/api.types';
import { ApiHelper } from '../utils/apiHelper';

export abstract class BaseApi {
  protected readonly request: APIRequestContext;
  protected authToken?: string;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  protected getAuthHeaders(): Record<string, string> {
    if (!this.authToken) {
      return {};
    }
    return { Authorization: `Bearer ${this.authToken}` };
  }

  protected async get(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse> {
    return ApiHelper.executeRequest(this.request, 'GET', endpoint, {
      ...options,
      headers: { ...this.getAuthHeaders(), ...options.headers },
    });
  }

  protected async post(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse> {
    return ApiHelper.executeRequest(this.request, 'POST', endpoint, {
      ...options,
      headers: { ...this.getAuthHeaders(), ...options.headers },
    });
  }

  protected async put(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse> {
    return ApiHelper.executeRequest(this.request, 'PUT', endpoint, {
      ...options,
      headers: { ...this.getAuthHeaders(), ...options.headers },
    });
  }

  protected async delete(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse> {
    return ApiHelper.executeRequest(this.request, 'DELETE', endpoint, {
      ...options,
      headers: { ...this.getAuthHeaders(), ...options.headers },
    });
  }
}
