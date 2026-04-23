import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { OrdersAdminService } from '../admin/services/orders-admin.service';
import { AdminOrder } from '../../models/admin.model';
import { RealtimeService } from '../../services/realtime.service';
import { Subscription } from 'rxjs';

interface OrderStatusEvent { id: string; status: string; trackingNumber?: string; }

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit, OnDestroy {
  orders: AdminOrder[] = [];
  loading = true;
  private _subs = new Subscription();

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
    private rt: RealtimeService,
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/auth']);
      return;
    }
    this.ordersService.getMyOrders().subscribe(list => {
      this.orders = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      this.loading = false;

      // Subscribe to real-time status updates for each order
      for (const order of this.orders) {
        this.rt.invoke('SubscribeToOrder', order.id);
      }
    });

    // Patch order status in-place when hub fires
    this._subs.add(
      this.rt.on<OrderStatusEvent>('OrderStatusChanged').subscribe(evt => {
        this.orders = this.orders.map(o =>
          o.id === evt.id
            ? { ...o, status: evt.status as AdminOrder['status'], trackingNumber: evt.trackingNumber ?? o.trackingNumber }
            : o
        );
      })
    );
  }

  ngOnDestroy(): void { this._subs.unsubscribe(); }
}
