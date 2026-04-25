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
  constructor(
    private ordersSvc: OrdersAdminService,
    private productsSvc: ProductsAdminService,
    private customersSvc: CustomersAdminService,
  ) {}

  allProducts: Product[] = [];
  filtered: Product[] = [];
  cart: SaleCartItem[] = [];
  search = '';
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
  newCustPhone = '';
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
    this.productsSvc.getProducts().subscribe(p => { this.allProducts = p; this.filtered = p; });
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
    this.newCustName = this.newCustEmail = this.newCustPhone = this.newCustError = '';
  }

  onCustomerBlur(): void {
    setTimeout(() => { this.showCustomerDropdown = false; }, 150);
  }

  openQuickCreate(): void {
    this.newCustName = this.customerSearch;
    this.newCustEmail = this.newCustPhone = this.newCustError = '';
    this.showQuickCreate = true;
    this.showCustomerDropdown = false;
  }

  cancelQuickCreate(): void {
    this.showQuickCreate = false;
    this.newCustError = '';
  }

  saveQuickCreate(): void {
    if (!this.newCustName.trim() || !this.newCustEmail.trim()) return;
    this.newCustSaving = true;
    this.newCustError = '';
    const password = 'Pass@' + Math.floor(1000 + Math.random() * 9000);
    this.customersSvc.add({
      name: this.newCustName.trim(),
      email: this.newCustEmail.trim(),
      password,
      phone: this.newCustPhone.trim() || undefined,
    }).subscribe(result => {
      this.newCustSaving = false;
      if (result.success) {
        // Seleccionar el cliente recién creado
        this.customersSvc.getCustomers().subscribe(list => {
          const created = list.find(c => c.email === this.newCustEmail.trim());
          if (created) this.selectCustomer(created);
          else { this.customerSearch = this.newCustName.trim(); this.showQuickCreate = false; }
        });
      } else {
        this.newCustError = result.error ?? 'Error al crear el cliente';
      }
    });
  }

  filterProducts(): void {
    const q = this.search.toLowerCase();
    this.filtered = this.allProducts.filter(p =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    );
  }

  addToCart(p: Product): void {
    if (p.stock <= 0) return;
    const existing = this.cart.find(c => c.productId === p.id);
    if (existing) {
      if (existing.qty < p.stock) existing.qty++;
    } else {
      this.cart.push({ productId: p.id, productName: p.name, productSku: p.sku,
        productImage: p.images[0] ?? '', price: p.price, qty: 1 });
    }
  }

  removeFromCart(i: number): void { this.cart.splice(i, 1); }

  changeQty(item: SaleCartItem, delta: number): void {
    if (delta > 0) {
      const stock = this.allProducts.find(p => p.id === item.productId)?.stock ?? 0;
      if (item.qty >= stock) return;
    }
    item.qty += delta;
    if (item.qty <= 0) this.cart = this.cart.filter(c => c !== item);
  }

  stockOf(productId: number): number {
    return this.allProducts.find(p => p.id === productId)?.stock ?? 0;
  }

  atMaxQty(item: SaleCartItem): boolean {
    return item.qty >= this.stockOf(item.productId);
  }

  onPaymentChange(): void {
    // Transferencia siempre inicia como pendiente de cobro
    if (this.paymentMethod === 'Transferencia') this.payStatus = 'pending_transfer';
    else this.payStatus = 'paid';
  }

  get subtotal(): number { return this.cart.reduce((s, c) => s + c.price * c.qty, 0); }
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
      }, 3500);
    });
  }
}
