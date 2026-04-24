export interface CompetitorPrice {
  id?: number;
  platform: string;
  price: number;
  url?: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  brand: string;
  rating: number;
  reviews: number;
  stock: number;
  badge?: 'new' | 'sale' | 'hot' | 'bestseller';
  tags: string[];
  sku: string;
  volume?: string;
  certifications?: string[];
  competitorPrices?: CompetitorPrice[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  count: number;
}
