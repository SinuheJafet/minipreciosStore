import { Component, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { AdminStats, AdminOrder } from '../../../models/admin.model';
import { Product } from '../../../models/product.model';
import { OrdersAdminService } from '../services/orders-admin.service';
import { InventoryAdminService } from '../services/inventory-admin.service';
import { UsersAdminService } from '../services/users-admin.service';

@Component({
  selector: 'admin-dashboard-section',
  templateUrl: './dashboard-section.component.html',
  styleUrls: ['./dashboard-section.component.scss']
})
export class DashboardSectionComponent implements OnInit {
  statsData: AdminStats | null = null;
  recentList: AdminOrder[] = [];
  lowStockList: Product[] = [];

  constructor(
    private ordersSvc: OrdersAdminService,
    private inventorySvc: InventoryAdminService,
    private usersSvc: UsersAdminService,
  ) {}

  ngOnInit(): void {
    const today = new Date().toISOString().slice(0, 10);
    const orders$ = this.ordersSvc.getOrders();
    const inv$    = this.inventorySvc.getInventory();
    const users$  = this.usersSvc.getUsers();

    combineLatest([orders$, inv$, users$]).subscribe(([orders, inv, users]) => {
      this.statsData = {
        totalRevenue:       orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
        totalOrders:        orders.length,
        pendingOrders:      orders.filter(o => o.status === 'pending').length,
        totalProducts:      inv.length,
        lowStockProducts:   inv.filter(p => p.stock > 0 && p.stock <= 5).length,
        outOfStockProducts: inv.filter(p => p.stock === 0).length,
        totalUsers:         users.length,
        revenueToday:       orders.filter(o => o.createdAt === today && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
        ordersToday:        orders.filter(o => o.createdAt === today).length,
      };
    });

    orders$.subscribe(o => this.recentList = o.slice(0, 5));
    inv$.subscribe(p => this.lowStockList = p.filter(x => x.stock <= 5));
  }

  statusLabel(s: string): string {
    const map: Record<string,string> = { pending:'Pendiente', processing:'Procesando', shipped:'Enviado', delivered:'Entregado', cancelled:'Cancelado' };
    return map[s] ?? s;
  }
}
