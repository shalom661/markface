export const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || 'https://markface-api.onrender.com/api/v1';

export interface ProductVariant {
  id: string;
  sku: string;
  attributes: Record<string, any>;
  price_default: number;
  image_url: string | null;
  active: boolean;
  inventory?: {
    quantity: number;
  };
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  images: string[] | null;
  active: boolean;
  variants: ProductVariant[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export async function fetchProducts(page = 1, pageSize = 20): Promise<PaginatedResponse<Product>> {
  const res = await fetch(`${HUB_API_URL}/products?page=${page}&page_size=${pageSize}&active_only=true`, {
    next: { revalidate: 3600 }, // Revalidate every hour
  });

  if (!res.ok) {
    throw new Error('Failed to fetch products from Hub');
  }

  return res.json();
}

export async function fetchProductById(id: string): Promise<Product> {
  const res = await fetch(`${HUB_API_URL}/products/${id}`, {
    next: { revalidate: 600 }, // Revalidate every 10 mins
  });

  if (!res.ok) {
    throw new Error('Failed to fetch product from Hub');
  }

  return res.json();
}
