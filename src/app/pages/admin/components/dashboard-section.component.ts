import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminStats, AdminOrder } from '../../../models/admin.model';
import { Product } from '../../../models/product.model';

@Component({
  selector: 'admin-dashboard-section',
  templateUrl: './dashboard-section.component.html',
  styleUrls: ['./dashboard-section.component.scss']
})
export class DashboardSectionComponent implements OnInit {
  @Input() stats!: Observable<AdminStats>;
  @Input() recentOrders!: Observable<AdminOrder[]>;
  @Input() lowStock!: Observable<Product[]>;

  statsData: AdminStats | null = null;
  recentList: AdminOrder[] = [];
  lowStockList: Product[] = [];

  ngOnInit(): void {
    this.stats.subscribe(s => this.statsData = s);
    this.recentOrders.subscribe(o => this.recentList = o.slice(0, 5));
    this.lowStock.subscribe(p => this.lowStockList = p.filter(x => x.stock <= 5));
  }

  statusLabel(s: string): string {
    const map: Record<string,string> = { pending:'Pendiente', processing:'Procesando', shipped:'Enviado', delivered:'Entregado', cancelled:'Cancelado' };
    return map[s] ?? s;
  }
}
