import { Component, OnInit } from '@angular/core';
import { Order } from '../../models/order.model';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/auth']);
      return;
    }
    // Aquí deberías llamar a un servicio real que consuma /api/orders/my
    // Por ahora, se deja como mock hasta conectar con backend
    // this.ordersService.getMyOrders().subscribe(...)
    this.loading = false;
  }
}
