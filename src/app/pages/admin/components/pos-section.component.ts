import { Component, OnInit } from '@angular/core';
import { SaleCartItem, StoreCustomer } from '../../../models/admin.model';
import { Kit } from '../../../models/kit.model';
import { Product } from '../../../models/product.model';
import { OrdersAdminService } from '../services/orders-admin.service';
import { ProductsAdminService } from '../services/products-admin.service';
import { CustomersAdminService } from '../services/customers-admin.service';
import { KitsAdminService } from '../services/kits-admin.service';

type PayStatus = 'paid' | 'pending_transfer';

interface PosCatalogItem {
  itemType: 'product' | 'kit';
  id: number;
  name: string;
  sku: string;
  description: string;
  imageUrl: string;
  price: number;
  stock: number;
  product?: Product;
  kit?: Kit;
}

interface SalePaymentDraft {
  amount: number;
  method: string;
  notes?: string;
}

@Component({
  selector: 'admin-pos-section',
  templateUrl: './pos-section.component.html',
  styleUrls: ['./pos-section.component.scss']
})
export class PosSectionComponent implements OnInit {
  private readonly cartStorageKey = 'miniprecios.admin.pos.cart';

  constructor(
    private ordersSvc: OrdersAdminService,
    private productsSvc: ProductsAdminService,
    private customersSvc: CustomersAdminService,
    private kitsSvc: KitsAdminService,
  ) {}

  allProducts: Product[] = [];
  allKits: Kit[] = [];
  filtered: PosCatalogItem[] = [];
  cart: SaleCartItem[] = [];
  payments: SalePaymentDraft[] = [{ amount: 0, method: 'Efectivo' }];
  search = '';
  posScanError = '';
  discount = 0;
  paymentMethod = 'Efectivo';
  payStatus: PayStatus = 'paid';
  notes = '';

  allCustomers: StoreCustomer[] = [];
  customerSearch = '';
  showCustomerDropdown = false;
  selectedCustomer: StoreCustomer | null = null;

  showQuickCreate = false;
  newCustName = '';
  newCustEmail = '';
  newCustPassword = '';
  newCustConfirmPassword = '';
  newCustPhone = '';
  newCustAddress = '';
  newCustCity = '';
  newCustState = '';
  newCustZipCode = '';
  newCustCountry = 'Mexico';
  newCustShowAddress = false;
  newCustSaving = false;
  newCustError = '';

  saleConfirmed = false;
  confirmedOrderId = '';
  paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia', 'PayPal'];

  get customerResults(): StoreCustomer[] {
    const q = this.customerSearch.toLowerCase().trim();
    const list = q
      ? this.allCustomers.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone ?? '').includes(q))
      : this.allCustomers;
    return list.filter(c => c.isActive).slice(0, 8);
  }

  get customerName(): string { return this.selectedCustomer?.name ?? this.customerSearch; }
  get customerPhone(): string { return this.selectedCustomer?.phone ?? this.newCustPhone; }
  get paidAmount(): number {
    return this.payStatus === 'pending_transfer'
      ? 0
      : this.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  }
  get pendingAmount(): number {
    return Math.max(0, this.total - this.paidAmount);
  }
  get hasPaymentOverflow(): boolean {
    return this.paidAmount > this.total + 0.001;
  }

  ngOnInit(): void {
    this.loadCartState();

    this.productsSvc.getProducts().subscribe(products => {
      this.allProducts = products;
      this.refreshCatalog();
      this.normalizeCartByStock();
    });
    this.kitsSvc.getKits().subscribe(kits => {
      this.allKits = kits.filter(k => k.isActive);
      this.refreshCatalog();
      this.normalizeCartByStock();
    });
    this.customersSvc.getCustomers().subscribe(c => this.allCustomers = c);
    this.syncPaymentDrafts();
  }

  selectCustomer(c: StoreCustomer): void {
    this.selectedCustomer = c;
    this.customerSearch = c.name;
    this.showCustomerDropdown = false;
    this.showQuickCreate = false;
  }

  clearCustomer(): void {
    this.selectedCustomer = null;
    this.customerSearch = '';
    this.showCustomerDropdown = false;
    this.showQuickCreate = false;
    this.resetQuickCreateForm();
  }

  onCustomerBlur(): void {
    setTimeout(() => { this.showCustomerDropdown = false; }, 150);
  }

  openQuickCreate(): void {
    this.newCustName = this.customerSearch;
    this.newCustEmail = '';
    this.newCustPassword = '';
    this.newCustConfirmPassword = '';
    this.newCustPhone = '';
    this.newCustAddress = '';
    this.newCustCity = '';
    this.newCustState = '';
    this.newCustZipCode = '';
    this.newCustCountry = 'Mexico';
    this.newCustShowAddress = false;
    this.newCustError = '';
    this.showQuickCreate = true;
    this.showCustomerDropdown = false;
  }

  cancelQuickCreate(): void {
    this.showQuickCreate = false;
    this.resetQuickCreateForm();
  }

  get quickCreatePasswordMismatch(): boolean {
    return !!(this.newCustConfirmPassword && this.newCustPassword !== this.newCustConfirmPassword);
  }

  get quickCreateValid(): boolean {
    return !!(
      this.newCustName.trim() &&
      this.newCustEmail.trim() &&
      this.newCustPassword.length >= 6 &&
      this.newCustPassword === this.newCustConfirmPassword
    );
  }

  saveQuickCreate(): void {
    if (!this.quickCreateValid || this.newCustSaving) return;
    this.newCustSaving = true;
    this.newCustError = '';
    const email = this.newCustEmail.trim();
    const name = this.newCustName.trim();
    this.customersSvc.add({
      name,
      email,
      password: this.newCustPassword,
      phone: this.newCustPhone.trim() || undefined,
      address: this.newCustAddress.trim() || undefined,
      city: this.newCustCity.trim() || undefined,
      state: this.newCustState.trim() || undefined,
      zipCode: this.newCustZipCode.trim() || undefined,
      country: this.newCustCountry.trim() || undefined,
    }).subscribe(result => {
      this.newCustSaving = false;
      if (result.success) {
        this.customersSvc.getCustomers().subscribe(list => {
          const created = list.find(c => c.email === email);
          if (created) this.selectCustomer(created);
          else {
            this.customerSearch = name;
            this.showQuickCreate = false;
            this.resetQuickCreateForm();
          }
        });
      } else {
        this.newCustError = result.error ?? 'Error al crear el cliente';
      }
    });
  }

  private resetQuickCreateForm(): void {
    this.newCustName = '';
    this.newCustEmail = '';
    this.newCustPassword = '';
    this.newCustConfirmPassword = '';
    this.newCustPhone = '';
    this.newCustAddress = '';
    this.newCustCity = '';
    this.newCustState = '';
    this.newCustZipCode = '';
    this.newCustCountry = 'Mexico';
    this.newCustShowAddress = false;
    this.newCustError = '';
  }

  private refreshCatalog(): void {
    const query = this.search.toLowerCase().trim();
    const catalog = [
      ...this.allProducts.map(product => ({
        itemType: 'product' as const,
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description || product.brand || 'Producto individual',
        imageUrl: product.images[0] ?? '',
        price: product.price,
        stock: product.stock,
        product,
      })),
      ...this.allKits.map(kit => ({
        itemType: 'kit' as const,
        id: kit.id,
        name: kit.name,
        sku: kit.sku,
        description: kit.description || 'Kit',
        imageUrl: kit.imageUrl ?? '',
        price: kit.price,
        stock: this.kitStock(kit),
        kit,
      })),
    ];

    this.filtered = catalog.filter(item => {
      if (!query) return true;
      return item.name.toLowerCase().includes(query)
        || item.sku.toLowerCase().includes(query)
        || item.description.toLowerCase().includes(query);
    });
  }

  viewCart(): void {
    if (!this.cart.length || typeof document === 'undefined') return;
    document.querySelector('.pos-cart')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onPosSearchChange(value: string): void {
    this.search = value;
    this.posScanError = '';
    this.refreshCatalog();
  }

  onPosScanEnter(): void {
    const query = this.search.trim().toLowerCase();
    if (!query) return;

    const exact = this.filtered.find(item => item.sku.toLowerCase() === query)
      ?? this.filtered.find(item => item.name.toLowerCase() === query);

    if (exact) {
      if (exact.stock <= 0) {
        this.posScanError = `"${exact.name}" está agotado`;
        return;
      }
      const added = this.addCatalogItemToCart(exact);
      if (added) {
        this.search = '';
        this.refreshCatalog();
        this.posScanError = '';
      }
      return;
    }

    if (this.filtered.length === 1) {
      const item = this.filtered[0];
      if (item.stock <= 0) {
        this.posScanError = `"${item.name}" está agotado`;
        return;
      }
      const added = this.addCatalogItemToCart(item);
      if (added) {
        this.search = '';
        this.refreshCatalog();
        this.posScanError = '';
      }
      return;
    }

    if (this.filtered.length === 0) {
      this.posScanError = `Código no encontrado: "${this.search}"`;
    }
  }

  addCatalogItemToCart(item: PosCatalogItem): boolean {
    if (item.stock <= 0) return false;
    const currentQty = this.totalQtyByItem(item.itemType, item.id);
    if (currentQty >= item.stock) {
      this.posScanError = `Solo hay ${item.stock} uds de "${item.name}" disponibles`;
      return false;
    }

    const existing = this.cart.find(cartItem => this.cartItemKey(cartItem) === this.makeItemKey(item.itemType, item.id));
    if (existing) {
      existing.qty++;
    } else {
      this.cart.push({
        itemType: item.itemType,
        productId: item.itemType === 'product' ? item.id : undefined,
        kitId: item.itemType === 'kit' ? item.id : undefined,
        productName: item.name,
        productSku: item.sku,
        productImage: item.imageUrl,
        price: item.price,
        qty: 1,
      });
    }

    this.normalizeCartByStock();
    return true;
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
    this.normalizeCartByStock();
  }

  clearCart(): void {
    if (!this.cart.length) return;
    this.cart = [];
    this.discount = 0;
    this.notes = '';
    this.posScanError = '';
    this.payments = [{ amount: 0, method: this.paymentMethod }];
    this.saveCartState();
  }

  changeQty(item: SaleCartItem, delta: number): void {
    if (delta > 0) {
      const stock = this.stockOfItem(item);
      const usedByOthers = this.cart
        .filter(cartItem => cartItem !== item && this.cartItemKey(cartItem) === this.cartItemKey(item))
        .reduce((sum, cartItem) => sum + cartItem.qty, 0);
      if (item.qty >= Math.max(0, stock - usedByOthers)) return;
    }

    item.qty += delta;
    if (item.qty <= 0) {
      this.cart = this.cart.filter(cartItem => cartItem !== item);
    }
    this.normalizeCartByStock();
  }

  stockOfItem(item: SaleCartItem): number {
    if (item.itemType === 'kit') {
      const kit = this.allKits.find(candidate => candidate.id === item.kitId);
      return kit ? this.kitStock(kit) : 0;
    }

    return this.allProducts.find(product => product.id === item.productId)?.stock ?? 0;
  }

  cartQty(itemType: 'product' | 'kit', id: number): number {
    return this.totalQtyByItem(itemType, id);
  }

  atMaxQty(item: SaleCartItem): boolean {
    const stock = this.stockOfItem(item);
    const usedByOthers = this.cart
      .filter(cartItem => cartItem !== item && this.cartItemKey(cartItem) === this.cartItemKey(item))
      .reduce((sum, cartItem) => sum + cartItem.qty, 0);
    return item.qty >= Math.max(0, stock - usedByOthers);
  }

  private totalQtyByItem(itemType: 'product' | 'kit', id: number): number {
    return this.cart
      .filter(item => this.cartItemKey(item) === this.makeItemKey(itemType, id))
      .reduce((sum, item) => sum + item.qty, 0);
  }

  private cartItemKey(item: SaleCartItem): string {
    const type = (item.itemType ?? 'product') as 'product' | 'kit';
    return this.makeItemKey(type, type === 'kit' ? item.kitId ?? 0 : item.productId ?? 0);
  }

  private makeItemKey(itemType: 'product' | 'kit', id: number): string {
    return `${itemType}:${Number(id)}`;
  }

  private kitStock(kit: Kit): number {
    if (!kit.items.length) return 0;
    return kit.items.reduce((minStock, component) => {
      const product = this.allProducts.find(candidate => candidate.id === component.productId);
      if (!product || component.quantity <= 0) return 0;
      const componentStock = Math.floor(product.stock / component.quantity);
      return minStock === null ? componentStock : Math.min(minStock, componentStock);
    }, null as number | null) ?? 0;
  }

  private normalizeCartByStock(): void {
    const merged = new Map<string, SaleCartItem>();
    for (const item of this.cart) {
      const key = this.cartItemKey(item);
      const previous = merged.get(key);
      if (!previous) {
        merged.set(key, { ...item });
      } else {
        previous.qty += item.qty;
      }
    }

    const normalized: SaleCartItem[] = [];
    for (const item of merged.values()) {
      const stock = this.stockOfItem(item);
      const qty = Math.min(item.qty, Math.max(0, stock));
      if (qty > 0) normalized.push({ ...item, qty });
    }

    this.cart = normalized;
    this.saveCartState();
    this.syncPaymentDrafts();
  }

  private loadCartState(): void {
    try {
      const raw = localStorage.getItem(this.cartStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SaleCartItem[];
      if (!Array.isArray(parsed)) return;

      this.cart = parsed
        .filter(item => item && item.qty > 0 && (item.productId || item.kitId))
        .map(item => ({
          itemType: item.itemType === 'kit' ? 'kit' : 'product',
          productId: item.productId ? Number(item.productId) : undefined,
          kitId: item.kitId ? Number(item.kitId) : undefined,
          productName: item.productName,
          productSku: item.productSku,
          productImage: item.productImage,
          price: Number(item.price),
          qty: Number(item.qty),
        }));
    } catch {
      this.cart = [];
    }
  }

  private saveCartState(): void {
    try {
      localStorage.setItem(this.cartStorageKey, JSON.stringify(this.cart));
    } catch {
      // Ignore storage quota/availability errors.
    }
  }

  onPaymentChange(): void {
    if (this.paymentMethod === 'Transferencia') this.payStatus = 'pending_transfer';
    else this.payStatus = 'paid';
    this.syncPaymentDrafts();
  }

  addPayment(): void {
    this.payStatus = 'paid';
    this.payments.push({ amount: 0, method: this.paymentMethod });
  }

  removePayment(index: number): void {
    this.payments.splice(index, 1);
    if (!this.payments.length) {
      this.payments = [{ amount: 0, method: this.paymentMethod }];
    }
  }

  fillPendingAmount(index: number): void {
    const others = this.payments
      .filter((_, paymentIndex) => paymentIndex !== index)
      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    this.payments[index].amount = Math.max(0, this.total - others);
  }

  private syncPaymentDrafts(): void {
    if (this.payStatus === 'pending_transfer') {
      this.payments = [];
      return;
    }

    if (!this.payments.length) {
      this.payments = [{ amount: this.total, method: this.paymentMethod }];
      return;
    }

    this.payments = this.payments.map((payment, index) => ({
      ...payment,
      method: payment.method || this.paymentMethod,
      amount: index === 0 && payment.amount === 0 ? this.total : payment.amount,
    }));
  }

  get subtotal(): number { return this.cart.reduce((sum, item) => sum + item.price * item.qty, 0); }
  get cartUnitsCount(): number {
    return this.cart.reduce((sum, item) => sum + Math.min(item.qty, this.stockOfItem(item)), 0);
  }
  get cartProductsCount(): number {
    return this.cart.filter(item => Math.min(item.qty, this.stockOfItem(item)) > 0).length;
  }
  get discountAmount(): number { return this.subtotal * (this.discount / 100); }
  get total(): number { return this.subtotal - this.discountAmount; }

  get orderStatus(): string {
    return this.payStatus === 'pending_transfer' ? 'pending' : 'delivered';
  }

  get confirmLabel(): string {
    return this.payStatus === 'pending_transfer'
      ? 'Crear pedido (pendiente de pago)'
      : this.pendingAmount > 0.001
        ? 'Confirmar venta con saldo pendiente'
        : 'Confirmar venta';
  }

  confirmSale(): void {
    if (!this.cart.length || this.hasPaymentOverflow) return;

    const dto = {
      items: this.cart.map(item => ({
        itemType: item.itemType,
        productId: item.productId,
        kitId: item.kitId,
        quantity: item.qty,
      })),
      discountPercent: this.discount,
      paymentMethod: this.paymentMethod,
      payments: this.payStatus === 'pending_transfer'
        ? []
        : this.payments
            .filter(payment => (Number(payment.amount) || 0) > 0)
            .map(payment => ({
              amount: Number(payment.amount),
              method: payment.method,
              notes: payment.notes?.trim() || undefined,
            })),
      customerName: this.customerName || 'Cliente mostrador',
      customerPhone: this.customerPhone || undefined,
      customerId: this.selectedCustomer?.id ?? undefined,
      notes: this.notes || undefined,
      status: this.orderStatus,
    };

    this.ordersSvc.addSale(dto as any).subscribe(res => {
      this.confirmedOrderId = res?.id ?? ('POS-' + String(Date.now()).slice(-4));
      this.saleConfirmed = true;
      setTimeout(() => {
        this.cart = [];
        this.discount = 0;
        this.notes = '';
        this.paymentMethod = 'Efectivo';
        this.payStatus = 'paid';
        this.payments = [{ amount: 0, method: 'Efectivo' }];
        this.clearCustomer();
        this.saleConfirmed = false;
        this.confirmedOrderId = '';
        this.saveCartState();
      }, 3500);
    });
  }
}
