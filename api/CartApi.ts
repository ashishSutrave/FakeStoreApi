import { APIRequestContext } from '@playwright/test';
import { Endpoints } from '../constants/endpoints';
import { ApiResponse, Cart, CreateCartPayload } from '../types/api.types';
import { BaseApi } from './BaseApi';

export class CartApi extends BaseApi {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async getAllCarts(): Promise<ApiResponse<Cart[]>> {
    return this.get(Endpoints.CARTS.BASE) as Promise<ApiResponse<Cart[]>>;
  }

  async getCartById(id: number | string): Promise<ApiResponse<Cart>> {
    return this.get(Endpoints.CARTS.BY_ID(id)) as Promise<ApiResponse<Cart>>;
  }

  async createCart(payload: CreateCartPayload): Promise<ApiResponse<Cart>> {
    return this.post(Endpoints.CARTS.BASE, { data: payload }) as Promise<ApiResponse<Cart>>;
  }

  async updateCart(id: number | string, payload: CreateCartPayload): Promise<ApiResponse<Cart>> {
    return this.put(Endpoints.CARTS.BY_ID(id), { data: payload }) as Promise<ApiResponse<Cart>>;
  }

  async deleteCart(id: number | string): Promise<ApiResponse<unknown>> {
    return this.delete(Endpoints.CARTS.BY_ID(id));
  }
}
