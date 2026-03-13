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

export async function fetchProducts(
  page = 1, 
  pageSize = 20, 
  filters: { category?: string; min_price?: number; max_price?: number; sort?: string } = {}
): Promise<PaginatedResponse<Product>> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
    active_only: 'true',
  });

  if (filters.category) params.append('category', filters.category);
  if (filters.min_price) params.append('min_price', filters.min_price.toString());
  if (filters.max_price) params.append('max_price', filters.max_price.toString());
  if (filters.sort) params.append('sort', filters.sort);

  const res = await fetch(`${HUB_API_URL}/products?${params.toString()}`, {
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
