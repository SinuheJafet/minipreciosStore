import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { OrdersAdminService } from '../admin/services/orders-admin.service';
import { AdminOrder } from '../../models/admin.model';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  orders: AdminOrder[] = [];
  loading = true;

  readonly statusLabel: Record<string, string> = {
    pending:    'Pendiente',
    processing: 'En proceso',
    shipped:    'Enviado',
    delivered:  'Entregado',
    cancelled:  'Cancelado',
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private ordersService: OrdersAdminService,
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/auth']);
      return;
    }
    this.ordersService.getMyOrders().subscribe(list => {
      this.orders = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      this.loading = false;
    });
  }
}
