import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { AdminStats, AdminOrder, OrdersInsightsDto, OrdersPaymentMethodPointDto, OrdersReportDto, OrdersStatusFunnelPointDto, OrdersTopCustomerDto, OrdersTopProductDto, OrdersWeekdayTrendPointDto } from '../../../models/admin.model';
import { Product } from '../../../models/product.model';
import { ColumnSource } from '../../../shared/components/dynamic-table/dynamic-table.entities';
import { OrdersAdminService } from '../services/orders-admin.service';
import { InventoryAdminService } from '../services/inventory-admin.service';
import { UsersAdminService } from '../services/users-admin.service';

@Component({
  selector: 'admin-dashboard-section',
  templateUrl: './dashboard-section.component.html',
  styleUrls: ['./dashboard-section.component.scss']
})
export class DashboardSectionComponent implements OnInit, OnDestroy {
  readonly currentYear = new Date().getFullYear();
  statsData: AdminStats | null = null;
  recentList$: Observable<AdminOrder[]> = of([]);
  lowStockList$: Observable<Product[]> = of([]);
  pendingRevenue = 0;
  salesSeries: Array<{ label: string; realized: number; pending: number }> = [];
  salesMax = 0;
  selectedYear = this.currentYear;
  availableYears: number[] = [this.currentYear];
  yearlySalesSeries: Array<{ label: string; realized: number; pending: number }> = [];
  yearlySalesMax = 0;
  insightsDays = 30;
  insightsTop = 10;
  customerSort: 'orders' | 'spent' = 'orders';
  topCustomers: OrdersTopCustomerDto[] = [];
  topProducts: OrdersTopProductDto[] = [];
  topCustomersMax = 1;
  topProductsMax = 1;
  statusFunnel: OrdersStatusFunnelPointDto[] = [];
  statusFunnelMax = 1;
  paymentMethods: OrdersPaymentMethodPointDto[] = [];
  paymentMethodsMax = 1;
  weekdayTrend: OrdersWeekdayTrendPointDto[] = [];
  weekdayTrendMax = 1;

  private _subs = new Subscription();

  recentOrdersColumns: ColumnSource[] = [
    {
      columnDef: 'id',
      headerName: 'Pedido',
      isHtmlTemplate: true,
      contentTemplate: (o: AdminOrder) => `<span class="order-id-chip">${o.id}</span>`
    },
    {
      columnDef: 'customerName',
      headerName: 'Cliente',
      isHtmlTemplate: true,
      contentTemplate: (o: AdminOrder) =>
        `<span class="t-name">${o.customerName}</span><span class="t-sub">${o.customerEmail}</span>`
    },
    {
      columnDef: 'total',
      headerName: 'Total',
      isHtmlTemplate: true,
      contentTemplate: (o: AdminOrder) => `<span class="t-bold">$${o.total.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>`
    },
    {
      columnDef: 'status',
      headerName: 'Estado',
      isHtmlTemplate: true,
      contentTemplate: (o: AdminOrder) => `<span class="status-pill status-pill--${o.status}">${this.statusLabel(o.status)}</span>`
    }
  ];

  lowStockColumns: ColumnSource[] = [
    {
      columnDef: 'name',
      headerName: 'Producto',
      isHtmlTemplate: true,
      contentTemplate: (p: Product) => `<span class="t-name">${p.name}</span><span class="t-sub">${p.brand}</span>`
    },
    {
      columnDef: 'sku',
      headerName: 'SKU',
      isHtmlTemplate: true,
      contentTemplate: (p: Product) => `<code class="sku-code">${p.sku}</code>`
    },
    {
      columnDef: 'stock',
      headerName: 'Stock',
      isHtmlTemplate: true,
      contentTemplate: (p: Product) =>
        `<span class="stock-alert-pill ${p.stock === 0 ? 'out' : ''}">${p.stock === 0 ? 'Agotado' : p.stock + ' uds'}</span>`
    }
  ];

  constructor(
    private ordersSvc: OrdersAdminService,
    private inventorySvc: InventoryAdminService,
    private usersSvc: UsersAdminService,
  ) {}

  ngOnInit(): void {
    const inv$    = this.inventorySvc.getInventory();
    const users$  = this.usersSvc.getUsers();
    const orders$ = this.ordersSvc.getOrders();

    this.recentList$  = orders$.pipe(map(o => o.slice(0, 5)));
    this.lowStockList$ = inv$.pipe(map(p => p.filter(x => x.stock <= 5)));

    // ─── Local computation (always works, reacts to SignalR) ────────────────
    this._subs.add(
      combineLatest([orders$, inv$, users$]).subscribe(([orders, inv, users]) => {
        const today = this.toLocalDayKey(new Date());

        const realizedOrders = orders.filter(o => this.isRealizedStatus(o.status));
        const pendingOrders  = orders.filter(o => this.isPendingStatus(o.status));

        // Local charts are fallback only when report endpoint is not available.
        if (!this._reportLoaded) {
          const yearCandidates = [
            this.currentYear,
            ...orders.map(o => this.extractYear(o.createdAt)).filter((y): y is number => y !== null),
          ];
          this.availableYears = Array.from(new Set(yearCandidates)).sort((a, b) => b - a);
          if (!this.availableYears.includes(this.selectedYear)) {
            this.selectedYear = this.availableYears.includes(this.currentYear)
              ? this.currentYear : this.availableYears[0];
          }

          const seriesMap = new Map<string, { realized: number; pending: number }>();
          for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            seriesMap.set(this.toLocalDayKey(d), { realized: 0, pending: 0 });
          }
          for (const o of realizedOrders) {
            const k = this.extractDayKey(o.createdAt);
            const slot = seriesMap.get(k); if (slot) slot.realized += o.total;
          }
          for (const o of pendingOrders) {
            const k = this.extractDayKey(o.createdAt);
            const slot = seriesMap.get(k); if (slot) slot.pending += o.total;
          }

          const dayFmt = new Intl.DateTimeFormat('es-MX', { weekday: 'short' });
          this.salesSeries = Array.from(seriesMap.entries()).map(([date, t]) => ({
            label: dayFmt.format(new Date(`${date}T00:00:00`)).replace('.', ''),
            realized: t.realized,
            pending: t.pending,
          }));
          this.salesMax = Math.max(1, ...this.salesSeries.map(x => Math.max(x.realized, x.pending)));

          this.buildYearlySeries(orders, this.selectedYear);
        }

        // KPI stats (local baseline — overridden by backend report when available)
        const localRealized = realizedOrders.reduce((s, o) => s + o.total, 0);
        const localPending  = pendingOrders.reduce((s, o) => s + o.total, 0);
        this.pendingRevenue = localPending;

        // Only overwrite if backend hasn't already set statsData
        if (!this._reportLoaded) {
          this.statsData = {
            totalRevenue:       localRealized,
            totalOrders:        orders.length,
            pendingOrders:      pendingOrders.length,
            totalProducts:      inv.length,
            lowStockProducts:   inv.filter(p => p.stock > 0 && p.stock <= 5).length,
            outOfStockProducts: inv.filter(p => p.stock === 0).length,
            totalUsers:         users.length,
            revenueToday:       realizedOrders.filter(o => this.extractDayKey(o.createdAt) === today).reduce((s, o) => s + o.total, 0),
            ordersToday:        orders.filter(o => this.extractDayKey(o.createdAt) === today).length,
          };
        } else {
          // Keep backend revenue stats but refresh inventory/user counts
          this.statsData = {
            ...this.statsData!,
            totalProducts:      inv.length,
            lowStockProducts:   inv.filter(p => p.stock > 0 && p.stock <= 5).length,
            outOfStockProducts: inv.filter(p => p.stock === 0).length,
            totalUsers:         users.length,
          };
        }
      })
    );

    // ─── Backend report (overrides revenue KPIs when reachable) ─────────────
    this.loadReport(this.selectedYear);
    this.loadInsights(this.insightsDays, this.insightsTop, this.customerSort);
  }

  private _reportLoaded = false;

  private loadReport(year: number): void {
    this._subs.add(
      this.ordersSvc.getReport(7, year).subscribe(report => {
        if (!report) return;
        this._reportLoaded = true;
        this.applyReportStats(report);
      })
    );
  }

  private loadInsights(days: number, top: number, customerSort: 'orders' | 'spent'): void {
    this._subs.add(
      this.ordersSvc.getInsights(days, top, customerSort).subscribe(insights => {
        if (!insights) return;
        this.applyInsights(insights);
      })
    );
  }

  /** Applies KPIs and chart series from backend report (source of truth). */
  private applyReportStats(report: OrdersReportDto): void {
    const dayFmt = new Intl.DateTimeFormat('es-MX', { weekday: 'short' });
    this.salesSeries = report.dailySeries.map(p => ({
      label: dayFmt.format(new Date(`${p.date}T00:00:00`)).replace('.', ''),
      realized: p.realized,
      pending: p.pending,
    }));
    this.salesMax = Math.max(1, ...this.salesSeries.map(x => Math.max(x.realized, x.pending)));

    const monthFmt = new Intl.DateTimeFormat('es-MX', { month: 'short' });
    this.selectedYear = report.selectedYear;
    this.yearlySalesSeries = report.monthlySeries.map(p => ({
      label: monthFmt.format(new Date(report.selectedYear, p.month - 1, 1)).replace('.', ''),
      realized: p.realized,
      pending: p.pending,
    }));
    this.yearlySalesMax = Math.max(1, ...this.yearlySalesSeries.map(x => Math.max(x.realized, x.pending)));

    this.availableYears = report.availableYears.length ? report.availableYears : [this.currentYear];
    this.pendingRevenue = report.pendingRevenue;

    this.statsData = {
      totalRevenue:       report.realizedRevenue,
      totalOrders:        report.totalOrders,
      pendingOrders:      report.pendingOrders,
      totalProducts:      this.statsData?.totalProducts ?? 0,
      lowStockProducts:   this.statsData?.lowStockProducts ?? 0,
      outOfStockProducts: this.statsData?.outOfStockProducts ?? 0,
      totalUsers:         this.statsData?.totalUsers ?? 0,
      revenueToday:       report.realizedRevenueToday,
      ordersToday:        report.ordersToday,
    };
  }

  private applyInsights(insights: OrdersInsightsDto): void {
    this.insightsDays = insights.days;
    this.topCustomers = insights.topCustomers ?? [];
    this.topProducts = insights.topProducts ?? [];
    this.topCustomersMax = Math.max(1, ...this.topCustomers.map(x => x.totalSpent));
    this.topProductsMax = Math.max(1, ...this.topProducts.map(x => x.revenue));
    this.statusFunnel = insights.statusFunnel ?? [];
    this.statusFunnelMax = Math.max(1, ...this.statusFunnel.map(x => x.count));
    this.paymentMethods = insights.paymentMethods ?? [];
    this.paymentMethodsMax = Math.max(1, ...this.paymentMethods.map(x => x.revenue));
    this.weekdayTrend = insights.weekdayTrend ?? [];
    this.weekdayTrendMax = Math.max(1, ...this.weekdayTrend.map(x => Math.max(x.realized, x.pending)));
  }

  customerBarWidth(totalSpent: number): number {
    return Math.max(4, (totalSpent / this.topCustomersMax) * 100);
  }

  productBarWidth(revenue: number): number {
    return Math.max(4, (revenue / this.topProductsMax) * 100);
  }

  statusBarWidth(count: number): number {
    return Math.max(4, (count / this.statusFunnelMax) * 100);
  }

  paymentBarWidth(revenue: number): number {
    return Math.max(4, (revenue / this.paymentMethodsMax) * 100);
  }

  weekdayBarHeight(value: number): number {
    return Math.max(0, (value / this.weekdayTrendMax) * 100);
  }

  paymentMethodLabel(raw: string): string {
    const normalized = String(raw ?? '').toLowerCase().trim();
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      efectivo: 'Efectivo',
      transfer: 'Transferencia',
      transferencia: 'Transferencia',
      card: 'Tarjeta',
      tarjeta: 'Tarjeta',
      paypal: 'PayPal',
      sin_metodo: 'Sin metodo'
    };
    return labels[normalized] ?? (raw || 'Sin metodo');
  }

  onInsightsTopChange(value: string): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    this.insightsTop = parsed;
    this.loadInsights(this.insightsDays, this.insightsTop, this.customerSort);
  }

  onCustomerSortChange(value: string): void {
    if (value !== 'orders' && value !== 'spent') return;
    this.customerSort = value;
    this.loadInsights(this.insightsDays, this.insightsTop, this.customerSort);
  }

  paymentPieStyle(): string {
    return this.buildPieGradient(this.paymentMethods.map(x => x.revenue), ['#6d28d9', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']);
  }

  statusPieStyle(): string {
    const colors = this.statusFunnel.map(s => this.statusDotColor(s.status));
    return this.buildPieGradient(this.statusFunnel.map(x => x.count), colors);
  }

  statusDotColor(status: string): string {
    const s = String(status ?? '').toLowerCase().trim();
    const map: Record<string, string> = {
      pending: '#d97706', pending_transfer: '#d97706',
      paid: '#2563eb', processing: '#2563eb',
      shipped: '#8b5cf6', delivered: '#059669',
      cancelled: '#ef4444',
    };
    return map[s] ?? '#94a3b8';
  }

  statusFillStyle(status: string): string {
    const s = String(status ?? '').toLowerCase().trim();
    const map: Record<string, string> = {
      pending: 'linear-gradient(90deg,#f59e0b,#d97706)',
      pending_transfer: 'linear-gradient(90deg,#f59e0b,#d97706)',
      paid: 'linear-gradient(90deg,#60a5fa,#2563eb)',
      processing: 'linear-gradient(90deg,#60a5fa,#2563eb)',
      shipped: 'linear-gradient(90deg,#a78bfa,#6d28d9)',
      delivered: 'linear-gradient(90deg,#34d399,#059669)',
      cancelled: 'linear-gradient(90deg,#f87171,#dc2626)',
    };
    return map[s] ?? 'linear-gradient(90deg,#94a3b8,#64748b)';
  }

  paymentSliceColor(index: number): string {
    return ['#6d28d9', '#8b5cf6', '#a78bfa', '#60a5fa', '#34d399'][index % 5];
  }

  totalStatusCount(): number {
    return this.statusFunnel.reduce((s, x) => s + x.count, 0);
  }

  totalPaymentRevenue(): number {
    return this.paymentMethods.reduce((s, x) => s + x.revenue, 0);
  }

  private buildPieGradient(values: number[], palette: string[]): string {
    const total = values.reduce((s, v) => s + v, 0);
    if (total <= 0) return 'conic-gradient(#e2e8f0 0 100%)';
    let start = 0;
    const segments: string[] = [];
    values.forEach((value, idx) => {
      const fraction = value / total;
      const end = start + fraction * 100;
      const color = palette[idx % palette.length];
      segments.push(`${color} ${start.toFixed(2)}% ${end.toFixed(2)}%`);
      start = end;
    });
    return `conic-gradient(${segments.join(', ')})`;
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

  statusLabel(s: string): string {
    const map: Record<string,string> = { pending:'Pendiente', paid:'Pagado', processing:'Procesando', shipped:'Enviado', delivered:'Entregado', cancelled:'Cancelado' };
    return map[s] ?? s;
  }

  onYearChange(value: string): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    this.selectedYear = parsed;
    // Rebuild yearly series from local orders immediately, then refresh backend KPIs
    this.loadReport(parsed);
  }

  private toLocalDayKey(d: Date): string {
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private extractDayKey(raw: string): string {
    if (!raw) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw.slice(0, 10);
    return this.toLocalDayKey(parsed);
  }

  private extractYear(raw: string): number | null {
    const dayKey = this.extractDayKey(raw);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return null;
    const year = Number(dayKey.slice(0, 4));
    return Number.isFinite(year) ? year : null;
  }

  private buildYearlySeries(orders: AdminOrder[], year: number): void {
    const monthFmt = new Intl.DateTimeFormat('es-MX', { month: 'short' });
    const byMonth = Array.from({ length: 12 }, (_, index) => ({
      label: monthFmt.format(new Date(year, index, 1)).replace('.', ''),
      realized: 0,
      pending: 0,
    }));
    for (const order of orders) {
      const dayKey = this.extractDayKey(order.createdAt);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) continue;
      if (Number(dayKey.slice(0, 4)) !== year) continue;
      const month = Number(dayKey.slice(5, 7)) - 1;
      if (month < 0 || month > 11) continue;
      if (this.isRealizedStatus(order.status)) byMonth[month].realized += order.total;
      else if (this.isPendingStatus(order.status))  byMonth[month].pending  += order.total;
    }
    this.yearlySalesSeries = byMonth;
    this.yearlySalesMax = Math.max(1, ...byMonth.map(x => Math.max(x.realized, x.pending)));
  }

  private normalizeStatus(status: string): string {
    return String(status ?? '').toLowerCase().trim().replace(/\s+/g, '_');
  }

  private isPendingStatus(status: string): boolean {
    const s = this.normalizeStatus(status);
    return s === 'pending' || s === 'pending_transfer' || s === 'awaiting_payment'
        || s === 'payment_pending' || s === 'pendiente' || s === 'por_pagar';
  }

  private isRealizedStatus(status: string): boolean {
    const s = this.normalizeStatus(status);
    return s === 'paid' || s === 'processing' || s === 'shipped' || s === 'delivered'
        || s === 'completed' || s === 'confirmed' || s === 'success'
        || s === 'pagado' || s === 'procesando' || s === 'enviado' || s === 'entregado';
  }
}

