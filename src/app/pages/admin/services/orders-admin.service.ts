import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { AdminOrder } from '../../../models/admin.model';

@Injectable({ providedIn: 'root' })
export class OrdersAdminService {
  private baseUrl = '/api/orders';
  constructor(private api: ApiService) {}

  getOrders(): Observable<AdminOrder[]> {
    return of([
      { id: 'ORD-001', customerName: 'Juan Pérez',    customerEmail: 'juan@mail.com',
        items: [{ name: 'Café Orgánico', qty: 2, price: 120, image: '', sku: 'ECO-CAFE-500' }],
        subtotal: 240, discount: 0, shipping: 50, total: 290, status: 'pending',
        createdAt: '2026-04-22', address: 'Calle 123', city: 'CDMX', country: 'México',
        paymentMethod: 'Tarjeta', timeline: [] },
      { id: 'ORD-002', customerName: 'Ana López',     customerEmail: 'ana@mail.com',
        items: [{ name: 'Aceite de Oliva', qty: 1, price: 210, image: '', sku: 'OLIVAR-1L' }],
        subtotal: 210, discount: 10, shipping: 50, total: 250, status: 'shipped',
        createdAt: '2026-04-21', address: 'Av. Reforma', city: 'CDMX', country: 'México',
        paymentMethod: 'PayPal', timeline: [] },
      { id: 'ORD-003', customerName: 'Luis Martínez', customerEmail: 'luis@mail.com',
        items: [{ name: 'Café Orgánico', qty: 1, price: 120, image: '', sku: 'ECO-CAFE-500' },
                { name: 'Aceite de Oliva', qty: 2, price: 210, image: '', sku: 'OLIVAR-1L' }],
        subtotal: 540, discount: 54, shipping: 0, total: 486, status: 'delivered',
        createdAt: '2026-04-19', address: 'Blvd. Juárez', city: 'Guadalajara', country: 'México',
        paymentMethod: 'Efectivo', timeline: [] },
      { id: 'ORD-004', customerName: 'Sofía Ramos',   customerEmail: 'sofia@mail.com',
        items: [{ name: 'Aceite de Oliva', qty: 3, price: 210, image: '', sku: 'OLIVAR-1L' }],
        subtotal: 630, discount: 0, shipping: 0, total: 630, status: 'processing',
        createdAt: '2026-04-22', address: 'Calle Flores', city: 'Monterrey', country: 'México',
        paymentMethod: 'Tarjeta', timeline: [] },
      { id: 'ORD-005', customerName: 'Diego Soto',    customerEmail: 'diego@mail.com',
        items: [{ name: 'Café Orgánico', qty: 4, price: 120, image: '', sku: 'ECO-CAFE-500' }],
        subtotal: 480, discount: 48, shipping: 0, total: 432, status: 'cancelled',
        createdAt: '2026-04-18', address: 'Av. Central', city: 'Puebla', country: 'México',
        paymentMethod: 'PayPal', timeline: [] },
    ]);
  }

  updateOrder(id: string, order: Partial<AdminOrder>): Observable<AdminOrder> {
    return this.api.put<AdminOrder>(`${this.baseUrl}/${id}`, order);
  }
}
