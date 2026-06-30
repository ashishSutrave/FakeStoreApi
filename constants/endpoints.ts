export const Endpoints = {
  AUTH: {
    LOGIN: '/auth/login',
  },
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id: number | string) => `/products/${id}`,
  },
  CARTS: {
    BASE: '/carts',
    BY_ID: (id: number | string) => `/carts/${id}`,
  },
} as const;

export const getBaseUrl = (): string => {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error('BASE_URL environment variable is not defined');
  }
  return baseUrl.replace(/\/$/, '');
};
