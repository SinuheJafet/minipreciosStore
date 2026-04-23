import { Component, OnInit } from '@angular/core';
import { SaleCartItem } from '../../../models/admin.model';
import { Product } from '../../../models/product.model';
import { OrdersAdminService } from '../services/orders-admin.service';
import { ProductsAdminService } from '../services/products-admin.service';

type PayStatus = 'paid' | 'pending_transfer';

@Component({
  selector: 'admin-pos-section',
  templateUrl: './pos-section.component.html',
  styleUrls: ['./pos-section.component.scss']
})
export class PosSectionComponent implements OnInit {
  constructor(private ordersSvc: OrdersAdminService, private productsSvc: ProductsAdminService) {}

  allProducts: Product[] = [];
  filtered: Product[] = [];
  cart: SaleCartItem[] = [];
  search = '';
  discount = 0;
  paymentMethod = 'Efectivo';
  payStatus: PayStatus = 'paid';
  customerName = '';
  customerPhone = '';
  notes = '';
  saleConfirmed = false;
  confirmedOrderId = '';

  paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia', 'PayPal'];

  ngOnInit(): void {
    this.productsSvc.getProducts().subscribe(p => { this.allProducts = p; this.filtered = p; });
  }

  filterProducts(): void {
    const q = this.search.toLowerCase();
    this.filtered = this.allProducts.filter(p =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    );
  }

  addToCart(p: Product): void {
    const existing = this.cart.find(c => c.productId === p.id);
    if (existing) { existing.qty++; }
    else {
      this.cart.push({ productId: p.id, productName: p.name, productSku: p.sku,
        productImage: p.images[0] ?? '', price: p.price, qty: 1 });
    }
  }

  removeFromCart(i: number): void { this.cart.splice(i, 1); }

  changeQty(item: SaleCartItem, delta: number): void {
    item.qty += delta;
    if (item.qty <= 0) this.cart = this.cart.filter(c => c !== item);
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
      customerName: this.customerName || 'Cliente mostrador',
      status: this.orderStatus,
    };
    this.ordersSvc.addSale(dto).subscribe(res => {
      this.confirmedOrderId = res?.id ?? ('POS-' + String(Date.now()).slice(-4));
      this.saleConfirmed = true;
      setTimeout(() => {
        this.cart = []; this.discount = 0; this.customerName = '';
        this.customerPhone = ''; this.notes = '';
        this.paymentMethod = 'Efectivo'; this.payStatus = 'paid';
        this.saleConfirmed = false; this.confirmedOrderId = '';
      }, 3500);
    });
  }
}
