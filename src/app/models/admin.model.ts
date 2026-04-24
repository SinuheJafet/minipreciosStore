export interface AdminOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  items: { name: string; qty: number; price: number; image: string; sku: string; }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  address: string;
  city: string;
  country: string;
  paymentMethod: string;
  trackingNumber?: string;
  paymentProofUrl?: string;
  paymentProofStatus?: string;
  timeline: { date: string; label: string; done: boolean; }[];
}

export interface InventoryMovement {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  type: 'entrada' | 'salida' | 'ajuste';
  concept: string;
  quantity: number;
  lotCode?: string;
  notes: string;
  previousStock: number;
  newStock: number;
  createdBy: string;
  createdAt: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier' | 'viewer';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalUsers: number;
  revenueToday: number;
  ordersToday: number;
}

export interface SaleCartItem {
  productId: number;
  productName: string;
  productSku: string;
  productImage: string;
  price: number;
  qty: number;
}

export interface StoreCustomer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  registeredAt: string;
  lastOrderAt?: string;
  totalOrders: number;
  totalSpent: number;
  isActive: boolean;
}

export interface AdminBanner {
  id: number;
  type: 'hero' | 'promo' | 'popup';
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  position: number;
  validFrom?: string;
  validTo?: string;
}

export const MOVEMENT_CONCEPTS = {
  entrada: ['Compra a proveedor', 'Devolución de cliente', 'Ajuste de inventario', 'Transferencia entre almacenes', 'Otro'],
  salida:  ['Venta', 'Merma / daño', 'Muestra gratuita', 'Ajuste de inventario', 'Transferencia entre almacenes', 'Otro'],
  ajuste:  ['Conteo físico', 'Corrección de error', 'Auditoría', 'Otro'],
};
