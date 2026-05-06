export interface OrderPayment {
  id: number;
  amount: number;
  method: string;
  notes?: string;
  proofUrl?: string;
  recordedAt: string;
  recordedByName: string;
}

export interface AdminOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  items: { name: string; qty: number; price: number; image: string; sku: string; productId?: number; batchId?: number; batchCode?: string; }[];
  itemCount?: number;    // del endpoint de lista cuando no vienen los items completos
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  amountPaid?: number;
  amountPending?: number;
  payments?: OrderPayment[];
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
  unitCost?: number;   // costo unitario al momento de la entrada
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
  itemType?: 'product' | 'kit';
  productId?: number;
  kitId?: number;
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

export interface PurchaseBatch {
  id: number;
  code: string;              // Ej: "LOTE-2026-001"
  supplierName?: string;
  totalInvested: number;     // monto total pagado al proveedor
  description?: string;
  createdAt: string;
  // Campos calculados que devuelve el backend (o computados en frontend)
  productCount?: number;
  totalRevenuePotential?: number;  // sum(price * stock) de productos del lote
  roi?: number;                    // (totalRevenuePotential - totalInvested) / totalInvested * 100
}

export interface OrdersDailySeriesPointDto {
  date: string;
  realized: number;
  pending: number;
}

export interface OrdersMonthlySeriesPointDto {
  month: number;
  realized: number;
  pending: number;
}

export interface OrdersReportDto {
  realizedRevenue: number;
  pendingRevenue: number;
  totalOrders: number;
  realizedOrders: number;
  pendingOrders: number;
  realizedRevenueToday: number;
  ordersToday: number;
  selectedYear: number;
  availableYears: number[];
  dailySeries: OrdersDailySeriesPointDto[];
  monthlySeries: OrdersMonthlySeriesPointDto[];
}

export interface OrdersTopCustomerDto {
  name: string;
  email: string;
  totalSpent: number;
  ordersCount: number;
  averageTicket: number;
  lastPurchaseDate: string;
}

export interface OrdersTopProductDto {
  productId: number;
  productName: string;
  sku: string;
  quantitySold: number;
  revenue: number;
}

export interface OrdersInsightsDto {
  days: number;
  realizedRevenue: number;
  realizedOrders: number;
  topCustomers: OrdersTopCustomerDto[];
  topProducts: OrdersTopProductDto[];
  statusFunnel: OrdersStatusFunnelPointDto[];
  paymentMethods: OrdersPaymentMethodPointDto[];
  weekdayTrend: OrdersWeekdayTrendPointDto[];
}

export interface OrdersStatusFunnelPointDto {
  status: string;
  label: string;
  count: number;
}

export interface OrdersPaymentMethodPointDto {
  method: string;
  orders: number;
  revenue: number;
}

export interface OrdersWeekdayTrendPointDto {
  weekday: number;
  label: string;
  realized: number;
  pending: number;
}

export const MOVEMENT_CONCEPTS = {
  entrada: ['Compra a proveedor', 'Devolución de cliente', 'Ajuste de inventario', 'Transferencia entre almacenes', 'Otro'],
  salida:  ['Venta', 'Merma / daño', 'Muestra gratuita', 'Ajuste de inventario', 'Transferencia entre almacenes', 'Otro'],
  ajuste:  ['Conteo físico', 'Corrección de error', 'Auditoría', 'Otro'],
};
