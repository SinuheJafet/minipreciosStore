import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest, firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ColumnSource } from '../../../shared/components/dynamic-table/dynamic-table.entities';
import { AdminOrder } from '../../../models/admin.model';
import { OrdersAdminService } from '../services/orders-admin.service';
import { InventoryAdminService } from '../services/inventory-admin.service';
import { Product } from '../../../models/product.model';
import { ProductsAdminService } from '../services/products-admin.service';
import { environment } from '../../../../environments/environment';

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
  constructor(
    private svc: OrdersAdminService,
    private invSvc: InventoryAdminService,
    private prodSvc: ProductsAdminService,
    private http: HttpClient,
  ) {}

  private statusFilter$ = new BehaviorSubject<OrderStatus>('all');
  filtered$!: Observable<AdminOrder[]>;
  allOrders: AdminOrder[] = [];
  activeTab: OrderStatus = 'all';

  selectedOrder: AdminOrder | null = null;
  trackingInput = '';
  allProducts: Product[] = [];
  editingItems = false;
  editItems: Array<{ name: string; qty: number; price: number; originalPrice: number; discountPct: number; image: string; sku: string; productId?: number; batchId?: number; batchCode?: string }> = [];
  productBatches: Record<number, Array<{ id: number; code: string; supplierName?: string; entryDate: string; unitCost?: number }>> = {};
  itemSearch = '';
  itemResults: Product[] = [];
  showItemDropdown = false;
  savingItems = false;
  orderScanError = '';
  sharingTicket = false;

  // Payment form state
  showPaymentModal = false;
  paymentForm = { amount: null as number | null, method: 'cash', notes: '' };
  savingPayment = false;
  readonly paymentMethods = [
    { value: 'cash',          label: 'Efectivo' },
    { value: 'bank_transfer', label: 'Transferencia' },
    { value: 'card',          label: 'Tarjeta' },
    { value: 'paypal',        label: 'PayPal' },
  ];

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
      cell: (r: AdminOrder) => {
        const qty = r.items?.length
          ? r.items.reduce((s, i) => s + i.qty, 0)
          : (r.itemCount ?? null);
        return qty != null ? qty + ' uds' : '—';
      }},
    { columnDef: 'total', headerName: 'Total',
      isHtmlTemplate: true, contentTemplate: (r: AdminOrder) =>
        `<span style="font-weight:700;color:#0f172a">$${r.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>` },
    { columnDef: 'paymentMethod', headerName: 'Pago',
      isHtmlTemplate: true, contentTemplate: (r: AdminOrder) => {
        const methodMap: Record<string, string> = {
          bank_transfer: 'Transferencia', card: 'Tarjeta',
          paypal: 'PayPal', cash: 'Efectivo', bizum: 'Bizum',
        };
        const paymentLabel = methodMap[r.paymentMethod] ?? r.paymentMethod ?? '—';

        if (!r.paymentProofStatus) {
          return `<span style="font-size:12px;color:#334155">${paymentLabel || '—'}</span>`;
        }

        const cfg: Record<string, [string, string, string]> = {
          pending_review: ['#fef3c7', '#92400e', 'Comprobante en revisión'],
          approved: ['#dcfce7', '#166534', 'Comprobante aprobado'],
          rejected: ['#fee2e2', '#b91c1c', 'Comprobante rechazado'],
        };

        const [bg, color, label] = cfg[r.paymentProofStatus] ?? ['#e2e8f0', '#334155', r.paymentProofStatus];
        return `
          <span style="display:block;font-size:12px;color:#334155">${paymentLabel || '—'}</span>
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
      { icon: 'receipt_long', toolTip: 'Compartir ticket', color: 'op-ticket', action: (r: AdminOrder) => this.shareTicketFromList(r) },
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

  get kpiTotalOrders(): number {
    return this.allOrders.length;
  }

  get kpiPendingOrders(): number {
    return this.countByStatus('pending');
  }

  get kpiInProgressOrders(): number {
    return this.countByStatus('paid') + this.countByStatus('processing') + this.countByStatus('shipped');
  }

  get kpiTotalRevenue(): number {
    return this.allOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);
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
        const enriched: AdminOrder = {
          ...full,
          paymentProofUrl: full.paymentProofUrl ?? cachedLatest?.url,
          paymentProofStatus: full.paymentProofStatus ?? cachedLatest?.status,
        };
        this.selectedOrder = enriched;
        this.trackingInput = full.trackingNumber ?? '';
        // Actualizar la fila en allOrders para que la tabla muestre items y pago correctos
        this.allOrders = this.allOrders.map(o => o.id === enriched.id ? enriched : o);
      }
    });
  }

  closeDetail(): void { this.selectedOrder = null; }

  async shareTicketFromList(order: AdminOrder): Promise<void> {
    if (this.sharingTicket) return;
    this.sharingTicket = true;
    try {
      const full = await firstValueFrom(this.svc.getById(order.id));
      await this.shareTicket(full ?? order);
    } finally {
      this.sharingTicket = false;
    }
  }

  async shareSelectedTicket(): Promise<void> {
    if (!this.selectedOrder || this.sharingTicket) return;
    this.sharingTicket = true;
    try {
      await this.shareTicket(this.selectedOrder);
    } finally {
      this.sharingTicket = false;
    }
  }

  private async shareTicket(order: AdminOrder): Promise<void> {
    const blob = await this.buildTicketImage(order);
    const fileName = `${this.safeName(order.id)}-ticket-miniprecios.png`;
    await this.shareOrDownload(blob, fileName);
  }

  private async buildTicketImage(order: AdminOrder): Promise<Blob> {
    const canvas = this.renderTicketCanvas(order);
    return new Promise<Blob>(resolve => {
      canvas.toBlob(blob => resolve(blob as Blob), 'image/png', 0.96);
    });
  }

  private renderTicketCanvas(order: AdminOrder): HTMLCanvasElement {
    const W = 920;
    const items = order.items ?? [];
    const itemsHeight = Math.max(220, items.length * 54);
    const totalsHeight = 130;
    const customerHeight = 132;
    const H = 120 + customerHeight + itemsHeight + totalsHeight;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      if ((ctx as any).roundRect) (ctx as any).roundRect(x, y, w, h, r);
      else ctx.rect(x, y, w, h);
    };

    const fmt = (n: number) => '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const status = STATUS_LABELS[order.status] ?? order.status;

    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); rr(26, 26, W - 52, H - 52, 22); ctx.fill();

    ctx.fillStyle = '#7c3aed';
    ctx.beginPath(); rr(26, 26, W - 52, 88, 22); ctx.fill();
    ctx.fillRect(26, 92, W - 52, 22);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 30px system-ui, sans-serif';
    ctx.fillText('⚡ miniprecios', 54, 78);

    ctx.font = '700 22px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Ticket #${order.id}`, W - 56, 78);
    ctx.textAlign = 'left';

    const startY = 138;
    ctx.fillStyle = '#64748b';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText(`Fecha: ${order.createdAt}`, 54, startY);
    ctx.fillText(`Estado: ${status}`, 340, startY);

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); rr(50, startY + 18, W - 100, 98, 14); ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath(); rr(50, startY + 18, W - 100, 98, 14); ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '700 12px system-ui, sans-serif';
    ctx.fillText('CLIENTE', 68, startY + 48);
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.fillText(order.customerName || 'Publico general', 68, startY + 78);
    ctx.fillStyle = '#475569';
    ctx.font = '500 14px system-ui, sans-serif';
    const contactLine = [order.customerEmail, order.customerPhone].filter(Boolean).join(' · ');
    ctx.fillText(contactLine || 'Sin datos de contacto', 68, startY + 102);

    let y = startY + 142;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillText('PRODUCTO', 68, y);
    ctx.fillText('CANT', 560, y);
    ctx.fillText('P.U.', 650, y);
    ctx.fillText('SUBTOTAL', 770, y);

    y += 22;
    for (const item of items) {
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); rr(58, y - 16, W - 116, 42, 10); ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = '600 14px system-ui, sans-serif';
      const name = item.name.length > 38 ? item.name.slice(0, 37) + '…' : item.name;
      ctx.fillText(name, 68, y + 9);
      ctx.font = '700 14px system-ui, sans-serif';
      ctx.fillText(String(item.qty), 570, y + 9);
      ctx.fillText(fmt(item.price), 650, y + 9);
      ctx.fillText(fmt(item.qty * item.price), 770, y + 9);
      y += 54;
    }

    const totalsY = H - 180;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(58, totalsY);
    ctx.lineTo(W - 58, totalsY);
    ctx.stroke();

    const drawTotal = (label: string, value: string, lineY: number, bold = false) => {
      ctx.fillStyle = '#475569';
      ctx.font = `${bold ? '700' : '500'} ${bold ? 19 : 15}px system-ui, sans-serif`;
      ctx.fillText(label, 560, lineY);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(value, W - 68, lineY);
      ctx.textAlign = 'left';
    };

    drawTotal('Subtotal', fmt(order.subtotal), totalsY + 36);
    if (order.discount > 0) drawTotal('Descuento', '-' + fmt(order.discount), totalsY + 64);
    if (order.shipping > 0) drawTotal('Envio', fmt(order.shipping), totalsY + 92);
    drawTotal('TOTAL', fmt(order.total), totalsY + 130, true);

    return canvas;
  }

  private async shareOrDownload(blob: Blob, filename: string): Promise<void> {
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Ticket miniprecios' });
        return;
      } catch {
        // fallback download
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  private safeName(id: string): string {
    return String(id).replace(/[^a-z0-9]/gi, '-').toLowerCase();
  }

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
    this.editItems = this.selectedOrder.items.map(i => {
      const catalogPrice = this.allProducts.find(p => p.id === i.productId || p.sku === i.sku)?.price ?? i.price;
      const discountPct = catalogPrice > 0 && i.price < catalogPrice
        ? Number(((1 - i.price / catalogPrice) * 100).toFixed(1))
        : 0;
      return { ...i, originalPrice: catalogPrice, discountPct, batchId: i.batchId, batchCode: i.batchCode };
    });
    this.editingItems = true;
    this.itemSearch = '';
    this.productBatches = {};
    // Cargar lotes disponibles por producto (PEPS)
    const productIds = [...new Set(this.editItems.filter(i => i.productId).map(i => i.productId!))];
    productIds.forEach(pid => this.loadProductBatches(pid));
  }

  loadProductBatches(productId: number): void {
    this.http.get<any[]>(`${environment.apiUrl}/products/${productId}/batches`)
      .pipe(catchError(() => of([])))
      .subscribe(batches => {
        this.productBatches = {
          ...this.productBatches,
          [productId]: batches.map(b => ({
            id: b.id, code: b.code, supplierName: b.supplierName,
            entryDate: b.entryDate?.substring(0, 10) ?? '', unitCost: b.unitCost,
          })),
        };
      });
  }

  setItemBatch(i: number, batchId: number | null): void {
    const item = this.editItems[i];
    if (!item.productId) return;
    const batch = batchId ? (this.productBatches[item.productId] ?? []).find(b => b.id === batchId) : null;
    item.batchId = batchId ?? undefined;
    item.batchCode = batch?.code;
    // Persistir inmediatamente via PATCH
    if (this.selectedOrder) {
      this.http.patch(
        `${environment.apiUrl}/orders/${this.selectedOrder.id}/items/${(this.selectedOrder.items.find(si => si.productId === item.productId)?.productId ?? 0)}/batch`,
        { batchId }
      ).pipe(catchError(() => of(null))).subscribe();
    }
  }

  cancelEditItems(): void {
    this.editItems = [];
    this.editingItems = false;
    this.itemSearch = '';
    this.showItemDropdown = false;
    this.orderScanError = '';
  }

  /** Enter en el buscador de ítems: auto-agrega si SKU exacto o único resultado */
  onOrderSearchEnter(): void {
    const q = this.itemSearch.trim().toLowerCase();
    if (!q) return;
    const exact = this.allProducts.find(p => p.sku.toLowerCase() === q);
    if (exact) { this.addToEdit(exact); this.itemSearch = ''; this.orderScanError = ''; this.showItemDropdown = false; return; }
    const results = this.itemSearchResults;
    if (results.length === 1) { this.addToEdit(results[0]); this.itemSearch = ''; this.orderScanError = ''; this.showItemDropdown = false; }
    else if (results.length === 0) { this.orderScanError = `Sin resultados para "${this.itemSearch}"`; }
  }

  stockForEdit(item: { productId?: number; sku: string }): number {
    const p = this.allProducts.find(x => x.id === item.productId || x.sku === item.sku);
    return p?.stock ?? 0;
  }

  addToEdit(product: Product): void {
    const existing = this.editItems.find(i => i.productId === product.id || i.sku === product.sku);
    if (existing) {
      if (existing.qty < product.stock) existing.qty++;
    } else {
      if (product.stock <= 0) return;
      this.editItems.push({
        name: product.name, qty: 1, price: product.price,
        originalPrice: product.price, discountPct: 0,
        image: product.images[0] ?? '', sku: product.sku, productId: product.id,
      });
    }
    this.itemSearch = '';
    this.showItemDropdown = false;
    this.orderScanError = '';
  }

  onItemDiscountChange(i: number): void {
    const item = this.editItems[i];
    const pct = Math.min(100, Math.max(0, item.discountPct ?? 0));
    item.discountPct = pct;
    item.price = Number((item.originalPrice * (1 - pct / 100)).toFixed(2));
  }

  onItemPriceChange(i: number): void {
    const item = this.editItems[i];
    if (item.originalPrice > 0 && item.price >= 0) {
      item.discountPct = Number(((1 - item.price / item.originalPrice) * 100).toFixed(1));
    }
  }

  removeFromEdit(i: number): void { this.editItems.splice(i, 1); }

  changeQty(i: number, delta: number): void {
    const item = this.editItems[i];
    const next = item.qty + delta;
    if (next <= 0) {
      this.editItems.splice(i, 1);
    } else {
      const stock = this.stockForEdit(item);
      item.qty = stock > 0 ? Math.min(next, stock) : next;
    }
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

  // ── Payment methods ──────────────────────────────────────────────
  openAddPayment(): void {
    this.paymentForm = { amount: null, method: 'cash', notes: '' };
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
  }

  canAddPayment(): boolean {
    return !!this.selectedOrder &&
      this.selectedOrder.status !== 'cancelled' &&
      (this.selectedOrder.amountPending ?? 0) > 0;
  }

  savePayment(): void {
    if (!this.selectedOrder || !this.paymentForm.amount) return;
    this.savingPayment = true;
    this.svc.addPayment(this.selectedOrder.id, {
      amount: this.paymentForm.amount,
      method: this.paymentForm.method,
      notes: this.paymentForm.notes.trim() || undefined,
    }).subscribe(ok => {
      this.savingPayment = false;
      if (ok) {
        this.closePaymentModal();
        if (this.selectedOrder) {
          this.openDetail(this.selectedOrder);
        }
      }
    });
  }
}
