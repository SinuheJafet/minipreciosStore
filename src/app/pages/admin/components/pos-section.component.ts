import { Component, OnInit } from '@angular/core';
import { SaleCartItem, StoreCustomer } from '../../../models/admin.model';
import { Product } from '../../../models/product.model';
import { OrdersAdminService } from '../services/orders-admin.service';
import { ProductsAdminService } from '../services/products-admin.service';
import { CustomersAdminService } from '../services/customers-admin.service';

type PayStatus = 'paid' | 'pending_transfer';

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
  ) {}

  allProducts: Product[] = [];
  filtered: Product[] = [];
  cart: SaleCartItem[] = [];
  search = '';
  posScanError = '';
  discount = 0;
  paymentMethod = 'Efectivo';
  payStatus: PayStatus = 'paid';
  notes = '';

  /* ── Customer selector ── */
  allCustomers: StoreCustomer[] = [];
  customerSearch = '';
  showCustomerDropdown = false;
  selectedCustomer: StoreCustomer | null = null;

  /* ── Quick create ── */
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

  // Para el DTO — nombre y teléfono derivados del cliente seleccionado o del buscador
  get customerName(): string  { return this.selectedCustomer?.name  ?? this.customerSearch; }
  get customerPhone(): string { return this.selectedCustomer?.phone  ?? this.newCustPhone; }
  saleConfirmed = false;
  confirmedOrderId = '';

  paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia', 'PayPal'];

  ngOnInit(): void {
    this.loadCartState();

    this.productsSvc.getProducts().subscribe(p => {
      this.allProducts = p;
      this.filtered = p;
      this.normalizeCartByStock();
    });
    this.customersSvc.getCustomers().subscribe(c => this.allCustomers = c);
  }

  /* ── Customer selector methods ── */
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
        // Seleccionar el cliente recién creado
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

  filterProducts(): void {
    const q = this.search.toLowerCase();
    this.filtered = this.allProducts.filter(p =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    );
  }

  viewCart(): void {
    if (!this.cart.length) return;
    if (typeof document === 'undefined') return;
    const panel = document.querySelector('.pos-cart');
    panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onPosSearchChange(value: string): void {
    this.search = value;
    this.posScanError = '';
    this.filterProducts();
  }

  onPosScanEnter(): void {
    const q = this.search.trim().toLowerCase();
    if (!q) return;
    // 1. SKU exacto
    const exact = this.allProducts.find(p => p.sku.toLowerCase() === q);
    if (exact) {
      if (exact.stock <= 0) { this.posScanError = `"${exact.name}" está agotado`; return; }
      const added = this.addToCart(exact);
      if (added) {
        this.search = '';
        this.filterProducts();
        this.posScanError = '';
      }
      return;
    }
    // 2. Único resultado visible
    if (this.filtered.length === 1) {
      const p = this.filtered[0];
      if (p.stock <= 0) { this.posScanError = `"${p.name}" está agotado`; return; }
      const added = this.addToCart(p);
      if (added) {
        this.search = '';
        this.filterProducts();
        this.posScanError = '';
      }
      return;
    }
    // 3. Sin resultados
    if (this.filtered.length === 0) {
      this.posScanError = `Código no encontrado: "${this.search}"`;
    }
  }

  addToCart(p: Product): boolean {
    if (p.stock <= 0) return false;
    const currentQty = this.totalQtyByProduct(p.id);
    if (currentQty >= p.stock) {
      this.posScanError = `Solo hay ${p.stock} uds de "${p.name}" en stock`;
      return false;
    }

    const existing = this.cart.find(c => this.isSameProduct(c.productId, p.id));
    if (existing) {
      if (existing.qty < p.stock) existing.qty++;
    } else {
      this.cart.push({ productId: p.id, productName: p.name, productSku: p.sku,
        productImage: p.images[0] ?? '', price: p.price, qty: 1 });
    }

    this.normalizeCartByStock();
    return true;
  }

  removeFromCart(i: number): void {
    this.cart.splice(i, 1);
    this.normalizeCartByStock();
  }

  clearCart(): void {
    if (!this.cart.length) return;
    this.cart = [];
    this.discount = 0;
    this.notes = '';
    this.posScanError = '';
    this.saveCartState();
  }

  changeQty(item: SaleCartItem, delta: number): void {
    if (delta > 0) {
      const stock = this.stockOf(item.productId);
      const usedByOthers = this.cart
        .filter(c => c !== item && this.isSameProduct(c.productId, item.productId))
        .reduce((s, c) => s + c.qty, 0);
      if (item.qty >= Math.max(0, stock - usedByOthers)) return;
    }
    item.qty += delta;
    if (item.qty <= 0) this.cart = this.cart.filter(c => c !== item);
    this.normalizeCartByStock();
  }

  stockOf(productId: number): number {
    return this.allProducts.find(p => this.isSameProduct(p.id, productId))?.stock ?? 0;
  }

  cartQty(productId: number): number {
    return this.totalQtyByProduct(productId);
  }

  atMaxQty(item: SaleCartItem): boolean {
    const stock = this.stockOf(item.productId);
    const usedByOthers = this.cart
      .filter(c => c !== item && this.isSameProduct(c.productId, item.productId))
      .reduce((s, c) => s + c.qty, 0);
    return item.qty >= Math.max(0, stock - usedByOthers);
  }

  private isSameProduct(a: number, b: number): boolean {
    return Number(a) === Number(b);
  }

  private totalQtyByProduct(productId: number): number {
    return this.cart
      .filter(c => this.isSameProduct(c.productId, productId))
      .reduce((s, c) => s + c.qty, 0);
  }

  private normalizeCartByStock(): void {
    const merged = new Map<number, SaleCartItem>();
    for (const item of this.cart) {
      const key = Number(item.productId);
      const prev = merged.get(key);
      if (!prev) {
        merged.set(key, { ...item });
      } else {
        prev.qty += item.qty;
      }
    }

    const normalized: SaleCartItem[] = [];
    for (const [productId, item] of merged.entries()) {
      const stock = this.stockOf(productId);
      const qty = Math.min(item.qty, Math.max(0, stock));
      if (qty > 0) normalized.push({ ...item, qty });
    }
    this.cart = normalized;
    this.saveCartState();
  }

  private loadCartState(): void {
    try {
      const raw = localStorage.getItem(this.cartStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SaleCartItem[];
      if (!Array.isArray(parsed)) return;

      this.cart = parsed
        .filter(i => i && Number(i.productId) > 0 && Number(i.qty) > 0)
        .map(i => ({
          productId: Number(i.productId),
          productName: i.productName,
          productSku: i.productSku,
          productImage: i.productImage,
          price: Number(i.price),
          qty: Number(i.qty),
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
    // Transferencia siempre inicia como pendiente de cobro
    if (this.paymentMethod === 'Transferencia') this.payStatus = 'pending_transfer';
    else this.payStatus = 'paid';
  }

  get subtotal(): number { return this.cart.reduce((s, c) => s + c.price * c.qty, 0); }
  get cartUnitsCount(): number {
    return this.cart.reduce((s, c) => s + Math.min(c.qty, this.stockOf(c.productId)), 0);
  }
  get cartProductsCount(): number {
    return this.cart.filter(c => Math.min(c.qty, this.stockOf(c.productId)) > 0).length;
  }
  get discountAmount(): number { return this.subtotal * (this.discount / 100); }
  get total(): number { return this.subtotal - this.discountAmount; }

  get orderStatus(): string {
    return this.payStatus === 'pending_transfer' ? 'pending' : 'delivered';
  }

  get confirmLabel(): string {
    return this.payStatus === 'pending_transfer' ? 'Crear pedido (pendiente de pago)' : 'Confirmar venta';
  }

  confirmSale(): void {
    if (!this.cart.length) return;
    const dto = {
      items: this.cart.map(c => ({ productId: c.productId, quantity: c.qty })),
      discountPercent: this.discount,
      paymentMethod: this.paymentMethod,
      customerName:  this.customerName  || 'Cliente mostrador',
      customerPhone: this.customerPhone || undefined,
      customerId:    this.selectedCustomer?.id ?? undefined,
      notes: this.notes || undefined,
      status: this.orderStatus,
    };
    this.ordersSvc.addSale(dto).subscribe(res => {
      this.confirmedOrderId = res?.id ?? ('POS-' + String(Date.now()).slice(-4));
      this.saleConfirmed = true;
      setTimeout(() => {
        this.cart = []; this.discount = 0; this.notes = '';
        this.paymentMethod = 'Efectivo'; this.payStatus = 'paid';
        this.clearCustomer();
        this.saleConfirmed = false; this.confirmedOrderId = '';
        this.saveCartState();
      }, 3500);
    });
  }
}
