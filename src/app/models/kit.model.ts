export interface KitItem {
  productId: number;
  productName: string;
  quantity: number;
}

export interface Kit {
  id: number;
  name: string;
  description?: string;
  sku: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  badge?: string;
  isActive: boolean;
  items: KitItem[];
}
