import { APIRequestContext } from '@playwright/test';
import { Endpoints } from '../constants/endpoints';
import { ApiResponse, LoginCredentials, LoginResponse } from '../types/api.types';
import { ApiHelper, BROWSER_USER_AGENT } from '../utils/apiHelper';
import { BaseApi } from './BaseApi';

export class AuthApi extends BaseApi {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    return this.post(Endpoints.AUTH.LOGIN, {
      data: credentials,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': BROWSER_USER_AGENT,
      },
    }) as Promise<ApiResponse<LoginResponse>>;
  }

  async loginWithEnvCredentials(): Promise<ApiResponse<LoginResponse>> {
    const { username, password } = ApiHelper.getCredentials();
    return this.login({ username, password });
  }
}
