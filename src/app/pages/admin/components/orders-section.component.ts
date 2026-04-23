import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ColumnSource } from '../../../shared/components/dynamic-table/dynamic-table.entities';
import { AdminOrder } from '../../../models/admin.model';
import { OrdersAdminService } from '../services/orders-admin.service';

type OrderStatus = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', processing: 'Procesando', shipped: 'Enviado',
  delivered: 'Entregado', cancelled: 'Cancelado',
};
const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending:    ['processing', 'cancelled'],
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
  constructor(private svc: OrdersAdminService) {}

  private statusFilter$ = new BehaviorSubject<OrderStatus>('all');
  filtered$!: Observable<AdminOrder[]>;
  allOrders: AdminOrder[] = [];
  activeTab: OrderStatus = 'all';

  selectedOrder: AdminOrder | null = null;
  trackingInput = '';

  readonly statusLabels = STATUS_LABELS;
  readonly tabs: { key: OrderStatus; label: string }[] = [
    { key: 'all', label: 'Todos' }, { key: 'pending', label: 'Pendiente' },
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
    { columnDef: 'paymentMethod', headerName: 'Pago', cell: (r: AdminOrder) => r.paymentMethod },
    { columnDef: 'status', headerName: 'Estado',
      isHtmlTemplate: true, contentTemplate: (r: AdminOrder) => {
        const cfg: Record<string, [string, string]> = {
          pending: ['#fef3c7', '#d97706'], processing: ['#dbeafe', '#2563eb'],
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
  }

  setTab(tab: OrderStatus): void { this.activeTab = tab; this.statusFilter$.next(tab); }

  countByStatus(s: OrderStatus): number {
    return s === 'all' ? this.allOrders.length : this.allOrders.filter(o => o.status === s).length;
  }

  openDetail(order: AdminOrder): void {
    this.selectedOrder = { ...order };
    this.trackingInput = order.trackingNumber ?? '';
    this.svc.getById(order.id).subscribe(full => {
      if (full) {
        this.selectedOrder = full;
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
  }

  itemTotal(order: AdminOrder): number {
    return order.items.reduce((s, i) => s + i.qty * i.price, 0);
  }
}
