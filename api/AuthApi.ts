import { APIRequestContext } from '@playwright/test';
import { Endpoints, getBaseUrl } from '../constants/endpoints';
import { ApiResponse, LoginCredentials, LoginResponse } from '../types/api.types';
import { ApiHelper } from '../utils/apiHelper';
import { BaseApi } from './BaseApi';

export class AuthApi extends BaseApi {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    const baseUrl = getBaseUrl();

    return this.post(Endpoints.AUTH.LOGIN, {
      data: credentials,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/json',
        Origin: baseUrl,
        Referer: `${baseUrl}/`,
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      },
    }) as Promise<ApiResponse<LoginResponse>>;
  }

  async loginWithEnvCredentials(): Promise<ApiResponse<LoginResponse>> {
    const { username, password } = ApiHelper.getCredentials();
    return this.login({ username, password });
  }
}
