import { APIRequestContext } from '@playwright/test';
import { Endpoints } from '../constants/endpoints';
import { ApiResponse, Product } from '../types/api.types';
import { BaseApi } from './BaseApi';

export class ProductApi extends BaseApi {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async getAllProducts(): Promise<ApiResponse<Product[]>> {
    return this.get(Endpoints.PRODUCTS.BASE) as Promise<ApiResponse<Product[]>>;
  }

  async getProductById(id: number | string): Promise<ApiResponse<Product>> {
    return this.get(Endpoints.PRODUCTS.BY_ID(id)) as Promise<ApiResponse<Product>>;
  }

  async createProduct(payload: Partial<Product>): Promise<ApiResponse<Product>> {
    return this.post(Endpoints.PRODUCTS.BASE, { data: payload }) as Promise<ApiResponse<Product>>;
  }

  async updateProduct(id: number | string, payload: Partial<Product>): Promise<ApiResponse<Product>> {
    return this.put(Endpoints.PRODUCTS.BY_ID(id), { data: payload }) as Promise<
      ApiResponse<Product>
    >;
  }

  async deleteProduct(id: number | string): Promise<ApiResponse<unknown>> {
    return this.delete(Endpoints.PRODUCTS.BY_ID(id));
  }
}
