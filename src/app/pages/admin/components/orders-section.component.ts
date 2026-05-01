import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ColumnSource } from '../../../shared/components/dynamic-table/dynamic-table.entities';
import { AdminOrder } from '../../../models/admin.model';
import { OrdersAdminService } from '../services/orders-admin.service';
import { InventoryAdminService } from '../services/inventory-admin.service';
import { Product } from '../../../models/product.model';
import { ProductsAdminService } from '../services/products-admin.service';

type OrderStatus = 'all' | 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagado', processing: 'Procesando', shipped: 'Enviado',
  delivered: 'Entregado', cancelled: 'Cancelado',
};
const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending:    ['paid',       'cancelled'],
  paid:       ['processing', 'cancelled'],
  processing: ['shipped',    'cancelled'],
  shipped:    ['delivered',  'cancelled'],
  delivered:  [],
  cancelled:  [],
};

@Component({
  selector: 'admin-orders-section',
  templateUrl: './orders-section.component.html',
  styleUrls: ['./orders-section.component.scss']
})
export class OrdersSectionComponent implements OnInit {
  orders!: Observable<AdminOrder[]>;
  constructor(private svc: OrdersAdminService, private invSvc: InventoryAdminService, private prodSvc: ProductsAdminService) {}

  private statusFilter$ = new BehaviorSubject<OrderStatus>('all');
  filtered$!: Observable<AdminOrder[]>;
  allOrders: AdminOrder[] = [];
  activeTab: OrderStatus = 'all';

  selectedOrder: AdminOrder | null = null;
  trackingInput = '';
  allProducts: Product[] = [];
  editingItems = false;
  editItems: Array<{ name: string; qty: number; price: number; image: string; sku: string; productId?: number }> = [];
  itemSearch = '';
  itemResults: Product[] = [];
  showItemDropdown = false;
  savingItems = false;

  readonly statusLabels = STATUS_LABELS;
  readonly tabs: { key: OrderStatus; label: string }[] = [
    { key: 'all', label: 'Todos' }, { key: 'pending', label: 'Pendiente' },
    { key: 'paid', label: 'Pagado' },
    { key: 'processing', label: 'Procesando' }, { key: 'shipped', label: 'Enviado' },
    { key: 'delivered', label: 'Entregado' }, { key: 'cancelled', label: 'Cancelado' },
  ];

  columns: ColumnSource[] = [
    { columnDef: 'id', headerName: 'Pedido',
      isHtmlTemplate: true, contentTemplate: (r: AdminOrder) =>
        `<span style="font-family:monospace;font-size:11px;font-weight:700;color:#7c3aed;background:#ede9fe;padding:2px 8px;border-radius:6px">${r.id}</span>` },
    { columnDef: 'customerName', headerName: 'Cliente',
      isHtmlTemplate: true, contentTemplate: (r: AdminOrder) =>
        `<span style="display:block;font-weight:600;color:#0f172a;font-size:13px">${r.customerName}</span>
         <span style="display:block;font-size:11px;color:#94a3b8">${r.customerEmail}</span>` },
    { columnDef: 'createdAt', headerName: 'Fecha', cell: (r: AdminOrder) => r.createdAt },
    { columnDef: 'items', headerName: 'Artículos',
      cell: (r: AdminOrder) => r.items.reduce((s, i) => s + i.qty, 0) + ' uds' },
    { columnDef: 'total', headerName: 'Total',
      isHtmlTemplate: true, contentTemplate: (r: AdminOrder) =>
        `<span style="font-weight:700;color:#0f172a">$${r.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>` },
    { columnDef: 'paymentMethod', headerName: 'Pago',
      isHtmlTemplate: true, contentTemplate: (r: AdminOrder) => {
        const paymentLabel = r.paymentMethod === 'bank_transfer' ? 'Transferencia' : r.paymentMethod;

        if (!r.paymentProofStatus) {
          return `<span style="font-size:12px;color:#334155">${paymentLabel}</span>`;
        }

        const cfg: Record<string, [string, string, string]> = {
          pending_review: ['#fef3c7', '#92400e', 'Comprobante en revisión'],
          approved: ['#dcfce7', '#166534', 'Comprobante aprobado'],
          rejected: ['#fee2e2', '#b91c1c', 'Comprobante rechazado'],
        };

        const [bg, color, label] = cfg[r.paymentProofStatus] ?? ['#e2e8f0', '#334155', r.paymentProofStatus];
        return `
          <span style="display:block;font-size:12px;color:#334155">${paymentLabel}</span>
          <span style="display:inline-block;margin-top:3px;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;background:${bg};color:${color}">${label}</span>
        `;
      } },
    { columnDef: 'status', headerName: 'Estado',
      isHtmlTemplate: true, contentTemplate: (r: AdminOrder) => {
        const cfg: Record<string, [string, string]> = {
          pending: ['#fef3c7', '#d97706'], processing: ['#dbeafe', '#2563eb'],
          paid: ['#dcfce7', '#166534'],
          shipped: ['#ede9fe', '#7c3aed'], delivered: ['#d1fae5', '#059669'],
          cancelled: ['#fef2f2', '#dc2626'],
        };
        const [bg, color] = cfg[r.status] ?? ['#f1f5f9', '#64748b'];
        return `<span style="padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;background:${bg};color:${color}">${STATUS_LABELS[r.status] ?? r.status}</span>`;
      }},
    { columnDef: 'detail', headerName: '', operations: [
        { icon: 'visibility', toolTip: 'Ver detalle', color: 'op-view', action: (r: AdminOrder) => this.openDetail(r) },
      ]},
  ];

  ngOnInit(): void {
    this.orders = this.svc.getOrders();
    this.orders.subscribe(o => this.allOrders = o);
    this.filtered$ = combineLatest([this.orders, this.statusFilter$]).pipe(
      map(([orders, status]) => status === 'all' ? orders : orders.filter(o => o.status === status))
    );
    this.prodSvc.getProducts().subscribe(p => this.allProducts = p);
  }

  setTab(tab: OrderStatus): void { this.activeTab = tab; this.statusFilter$.next(tab); }

  countByStatus(s: OrderStatus): number {
    return s === 'all' ? this.allOrders.length : this.allOrders.filter(o => o.status === s).length;
  }

  openDetail(order: AdminOrder): void {
    const cached = this.svc.getCachedPaymentProof(order.id);
    this.selectedOrder = {
      ...order,
      paymentProofUrl: order.paymentProofUrl ?? cached?.url,
      paymentProofStatus: order.paymentProofStatus ?? cached?.status,
    };
    this.trackingInput = order.trackingNumber ?? '';
    this.svc.getById(order.id).subscribe(full => {
      if (full) {
        const cachedLatest = this.svc.getCachedPaymentProof(full.id);
        this.selectedOrder = {
          ...full,
          paymentProofUrl: full.paymentProofUrl ?? cachedLatest?.url,
          paymentProofStatus: full.paymentProofStatus ?? cachedLatest?.status,
        };
        this.trackingInput = full.trackingNumber ?? '';
      }
    });
  }

  closeDetail(): void { this.selectedOrder = null; }

  nextStatuses(): string[] {
    return this.selectedOrder ? STATUS_TRANSITIONS[this.selectedOrder.status] ?? [] : [];
  }

  updateStatus(newStatus: string): void {
    if (!this.selectedOrder) return;
    this.svc.updateStatus(this.selectedOrder.id, newStatus as AdminOrder['status'], this.trackingInput || undefined);
    this.selectedOrder = { ...this.selectedOrder, status: newStatus as AdminOrder['status'],
      trackingNumber: this.trackingInput || undefined };
    // Fallback: si el hub no emite InventoryChanged, recargar inventario manualmente
    if (newStatus === 'cancelled') {
      this.invSvc.getInventory().subscribe();
    }
  }

  itemTotal(order: AdminOrder): number {
    return order.items.reduce((s, i) => s + i.qty * i.price, 0);
  }

  get canEditItems(): boolean {
    return !!this.selectedOrder && !['delivered', 'cancelled'].includes(this.selectedOrder.status);
  }

  get editSubtotal(): number {
    return this.editItems.reduce((s, i) => s + i.qty * i.price, 0);
  }

  get itemSearchResults(): Product[] {
    const q = this.itemSearch.toLowerCase().trim();
    if (!q) return [];
    return this.allProducts
      .filter(p => p.stock > 0 && (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)))
      .slice(0, 8);
  }

  startEditItems(): void {
    if (!this.selectedOrder) return;
    this.editItems = this.selectedOrder.items.map(i => ({ ...i }));
    this.editingItems = true;
    this.itemSearch = '';
  }

  cancelEditItems(): void {
    this.editItems = [];
    this.editingItems = false;
    this.itemSearch = '';
    this.showItemDropdown = false;
  }

  addToEdit(product: Product): void {
    const existing = this.editItems.find(i => i.productId === product.id || i.sku === product.sku);
    if (existing) {
      existing.qty++;
    } else {
      this.editItems.push({ name: product.name, qty: 1, price: product.price, image: product.images[0] ?? '', sku: product.sku, productId: product.id });
    }
    this.itemSearch = '';
    this.showItemDropdown = false;
  }

  removeFromEdit(i: number): void { this.editItems.splice(i, 1); }

  changeQty(i: number, delta: number): void {
    const item = this.editItems[i];
    const next = item.qty + delta;
    if (next <= 0) { this.editItems.splice(i, 1); } else { item.qty = next; }
  }

  saveItems(): void {
    if (!this.selectedOrder || this.savingItems || !this.editItems.length) return;
    this.savingItems = true;
    const items = this.editItems
      .map(i => ({
        productId: i.productId ?? this.allProducts.find(p => p.sku === i.sku)?.id ?? 0,
        quantity: i.qty,
        price: i.price,
      }))
      .filter(i => i.productId > 0);
    this.svc.updateItems(this.selectedOrder.id, items).subscribe(ok => {
      this.savingItems = false;
      if (ok && this.selectedOrder) {
        const newItems = this.editItems.map(i => ({ ...i }));
        const subtotal = this.editSubtotal;
        this.selectedOrder = { ...this.selectedOrder, items: newItems, subtotal, total: subtotal + (this.selectedOrder.shipping ?? 0) - (this.selectedOrder.discount ?? 0) };
        this.cancelEditItems();
      }
    });
  }

  onItemSearchBlur(): void { setTimeout(() => { this.showItemDropdown = false; }, 180); }
}
