import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AdminOrder } from '../../../models/admin.model';
import { environment } from '../../../../environments/environment';

interface BackendOrderItem { productName: string; productSku: string; price: number; quantity: number; }
interface BackendOrder {
  id: number; customerName: string; customerEmail: string; subtotal: number;
  discount: number; shipping: number; total: number; status: string;
  createdAt: string; address: string; city: string; country: string;
  paymentMethod: string; trackingNumber?: string;
  items?: BackendOrderItem[];
  timeline?: { label: string; date: string; done: boolean }[];
}
interface PagedOrderResponse { data: BackendOrder[]; total: number; page: number; pageSize: number; }

function mapOrder(o: BackendOrder): AdminOrder {
  return {
    id: o.id.toString(),
    customerName: o.customerName, customerEmail: o.customerEmail,
    items: (o.items || []).map(i => ({
      name: i.productName, qty: i.quantity, price: i.price, image: '', sku: i.productSku,
    })),
    subtotal: o.subtotal, discount: o.discount, shipping: o.shipping, total: o.total,
    status: o.status as AdminOrder['status'],
    createdAt: o.createdAt?.slice(0, 10) ?? '',
    address: o.address ?? '', city: o.city ?? '', country: o.country ?? '',
    paymentMethod: o.paymentMethod ?? '',
    trackingNumber: o.trackingNumber,
    timeline: (o.timeline || []).map(t => ({ date: t.date, label: t.label, done: t.done })),
  };
}

@Injectable({ providedIn: 'root' })
export class OrdersAdminService {
  private _data = new BehaviorSubject<AdminOrder[]>([]);
  private api = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  getOrders(): Observable<AdminOrder[]> {
    this.load();
    return this._data.asObservable();
  }

  getById(id: string): Observable<AdminOrder | null> {
    return this.http.get<BackendOrder>(`${this.api}/${id}`).pipe(
      map(mapOrder),
      catchError(() => of(null))
    );
  }

  get pendingCount$(): Observable<number> {
    return this._data.pipe(map(o => o.filter(x => x.status === 'pending').length));
  }

  getMyOrders(): Observable<AdminOrder[]> {
    return new Observable(obs => {
      this.http.get<BackendOrder[]>(`${this.api}/my`).pipe(catchError(() => of([] as BackendOrder[])))
        .subscribe(list => { obs.next(list.map(mapOrder)); obs.complete(); });
    });
  }

  /** Usado por el POS — POST /api/sales */
  addSale(dto: {
    items: { productId: number; quantity: number }[];
    discountPercent: number;
    paymentMethod: string;
    customerName?: string;
    status: string;
  }): Observable<{ id: string }> {
    return this.http.post<{ id: string; total: number }>(`${environment.apiUrl}/sales`, dto).pipe(
      catchError(() => of({ id: '' }))
    );
  }

  /** Usado por checkout — POST /api/orders */
  placeOrder(dto: {
    items: { productId: number; quantity: number }[];
    shipping: { fullName: string; email: string; phone: string; address: string; city: string; state: string; zipCode: string; country: string };
    paymentMethod: string;
    couponCode?: string;
  }): Observable<{ id: string }> {
    return this.http.post<BackendOrder>(this.api, dto).pipe(
      catchError(() => of(null as any))
    );
  }

  updateStatus(id: string, status: AdminOrder['status'], trackingNumber?: string): void {
    this.http.patch(`${this.api}/${id}/status`, { status, trackingNumber }).pipe(catchError(() => of(null)))
      .subscribe(() => this.load());
  }

  private load(): void {
    this.http.get<PagedOrderResponse | BackendOrder[]>(this.api).pipe(
      map(res => Array.isArray(res) ? res : res.data),
      catchError(() => of([] as BackendOrder[]))
    ).subscribe(list => this._data.next(list.map(mapOrder)));
  }
}
