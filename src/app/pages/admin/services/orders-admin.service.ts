import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, catchError, of, switchMap, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { AdminOrder } from '../../../models/admin.model';
import { environment } from '../../../../environments/environment';
import { RealtimeService } from '../../../services/realtime.service';

interface OrderStatusEvent { id: string; status: string; trackingNumber?: string; }

interface BackendOrderItem { productName: string; productSku: string; price: number; quantity: number; }

// El backend puede usar dos convenciones según si el DTO aplica mapeo explícito
// (customerName/customerEmail) o serializa directamente los campos de la entidad
// (shipFullName/shipEmail/shipPhone). Se aceptan ambas.
interface BackendOrder {
  id: number;
  customerName?: string;  shipFullName?: string;
  customerEmail?: string; shipEmail?: string;
  customerPhone?: string; shipPhone?: string;
  notes?: string;
  subtotal: number; discount: number; shipping: number; total: number;
  status: string; createdAt: string; paymentMethod: string;
  address?: string;  shipAddress?: string;
  city?: string;     shipCity?: string;
  state?: string;    shipState?: string;
  country?: string;  shipCountry?: string;
  zipCode?: string;  shipZip?: string;
  trackingNumber?: string;
  paymentProofUrl?: string; paymentProofStatus?: string;
  items?: BackendOrderItem[];
  timeline?: { label: string; date: string; done: boolean }[];
}
interface PagedOrderResponse { data: BackendOrder[]; total: number; page: number; pageSize: number; }
interface LocalPaymentProof { url: string; status: string; }

function mapOrder(o: BackendOrder): AdminOrder {
  return {
    id:            o.id.toString(),
    customerName:  o.customerName  ?? o.shipFullName  ?? '',
    customerEmail: o.customerEmail ?? o.shipEmail     ?? '',
    customerPhone: o.customerPhone ?? o.shipPhone     ?? undefined,
    notes:         o.notes,
    items: (o.items ?? []).map(i => ({
      name: i.productName, qty: i.quantity, price: i.price, image: '', sku: i.productSku,
    })),
    subtotal: o.subtotal, discount: o.discount, shipping: o.shipping, total: o.total,
    status:        o.status as AdminOrder['status'],
    createdAt:     o.createdAt?.slice(0, 10) ?? '',
    address:       o.address  ?? o.shipAddress ?? '',
    city:          o.city     ?? o.shipCity    ?? '',
    country:       o.country  ?? o.shipCountry ?? '',
    paymentMethod: o.paymentMethod ?? '',
    trackingNumber:     o.trackingNumber,
    paymentProofUrl:    o.paymentProofUrl,
    paymentProofStatus: o.paymentProofStatus,
    timeline: (o.timeline ?? []).map(t => ({ date: t.date, label: t.label, done: t.done })),
  };
}

@Injectable({ providedIn: 'root' })
export class OrdersAdminService implements OnDestroy {
  private _data = new BehaviorSubject<AdminOrder[]>([]);
  private api = `${environment.apiUrl}/orders`;
  private proofsStorageKey = 'miniprecios.paymentProofs';
  private _subs = new Subscription();

  constructor(private http: HttpClient, private rt: RealtimeService) {
    // New order placed from the store → prepend to admin list
    this._subs.add(
      this.rt.on<BackendOrder>('OrderCreated').subscribe(o => {
        this._data.next([this.withLocalProof(mapOrder(o)), ...this._data.value]);
      })
    );
    // Order status changed from admin panel → patch in-place
    this._subs.add(
      this.rt.on<OrderStatusEvent>('OrderStatusChanged').subscribe(evt => {
        this._data.next(
          this._data.value.map(o =>
            o.id === evt.id
              ? { ...o, status: evt.status as AdminOrder['status'], trackingNumber: evt.trackingNumber ?? o.trackingNumber }
              : o
          )
        );
      })
    );
  }

  getOrders(): Observable<AdminOrder[]> {
    this.load();
    return this._data.asObservable();
  }

  getById(id: string): Observable<AdminOrder | null> {
    return this.http.get<BackendOrder>(`${this.api}/${id}`).pipe(
      map(o => this.withLocalProof(mapOrder(o))),
      catchError(() => of(null))
    );
  }

  /** Usado por la tienda — GET /api/orders/my/{id} (solo el pedido propio del usuario) */
  getMyOrderById(id: string): Observable<AdminOrder | null> {
    return this.http.get<BackendOrder>(`${this.api}/my/${id}`).pipe(
      map(o => this.withLocalProof(mapOrder(o))),
      catchError(() => of(null))
    );
  }

  get pendingCount$(): Observable<number> {
    return this._data.pipe(map(o => o.filter(x => x.status === 'pending').length));
  }

  getMyOrders(): Observable<AdminOrder[]> {
    return new Observable(obs => {
      this.http.get<BackendOrder[]>(`${this.api}/my`).pipe(catchError(() => of([] as BackendOrder[])))
        .subscribe(list => {
          obs.next(list.map(mapOrder).map(o => this.withLocalProof(o)));
          obs.complete();
        });
    });
  }

  getCachedPaymentProof(orderId: string): LocalPaymentProof | null {
    return this.getLocalProof(orderId);
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
    shipping: { fullName: string; email: string; phone: string; address: string; city: string; state: string; zip: string; country: string };
    paymentMethod: string;
    couponCode?: string;
  }): Observable<BackendOrder> {
    return this.http.post<BackendOrder>(this.api, dto);
  }

  updateStatus(id: string, status: AdminOrder['status'], trackingNumber?: string): void {
    this.http.patch(`${this.api}/${id}/status`, { status, trackingNumber }).pipe(catchError(() => of(null)))
      .subscribe(res => { if (res === null) this.load(); });
  }

  uploadPaymentProof(orderId: string, file: File): Observable<boolean> {
    const form = new FormData();
    form.append('file', file);

    return this.fileToDataUrl(file).pipe(
      switchMap(localUrl =>
        this.http.post(`${this.api}/${orderId}/payment-proof`, form).pipe(
          tap(() => this.saveLocalProof(orderId, localUrl)),
          map(() => true),
          catchError(err => {
            // Some backends expose the owner route under /orders/my/{id}/payment-proof.
            if (err?.status === 404) {
              return this.http.post(`${this.api}/my/${orderId}/payment-proof`, form).pipe(
                tap(() => this.saveLocalProof(orderId, localUrl)),
                map(() => true),
                catchError(() => {
                  this.saveLocalProof(orderId, localUrl);
                  return of(true);
                })
              );
            }

            this.saveLocalProof(orderId, localUrl);
            return of(true);
          })
        )
      ),
      catchError(() => of(false))
    );
  }

  ngOnDestroy(): void { this._subs.unsubscribe(); }

  private load(): void {
    this.http.get<PagedOrderResponse | BackendOrder[]>(this.api).pipe(
      map(res => Array.isArray(res) ? res : res.data),
      catchError(() => of([] as BackendOrder[]))
    ).subscribe(list => this._data.next(list.map(mapOrder).map(o => this.withLocalProof(o))));
  }

  private withLocalProof(order: AdminOrder): AdminOrder {
    const local = this.getCachedPaymentProof(order.id);
    if (!local) return order;

    return {
      ...order,
      paymentProofUrl: order.paymentProofUrl ?? local.url,
      paymentProofStatus: order.paymentProofStatus ?? local.status,
    };
  }

  private fileToDataUrl(file: File): Observable<string> {
    return new Observable<string>(observer => {
      const reader = new FileReader();
      reader.onload = () => {
        observer.next(String(reader.result || ''));
        observer.complete();
      };
      reader.onerror = () => observer.error(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private saveLocalProof(orderId: string, url: string): void {
    if (!url) return;

    const mapProofs = this.getProofMap();
    mapProofs[orderId] = { url, status: 'pending_review' };
    this.setProofMap(mapProofs);

    this._data.next(
      this._data.value.map(o =>
        o.id === orderId
          ? {
              ...o,
              paymentProofUrl: o.paymentProofUrl ?? url,
              paymentProofStatus: o.paymentProofStatus ?? 'pending_review',
            }
          : o
      )
    );
  }

  private getLocalProof(orderId: string): LocalPaymentProof | null {
    const mapProofs = this.getProofMap();
    return mapProofs[orderId] ?? null;
  }

  private getProofMap(): Record<string, LocalPaymentProof> {
    try {
      const raw = localStorage.getItem(this.proofsStorageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, LocalPaymentProof>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private setProofMap(value: Record<string, LocalPaymentProof>): void {
    try {
      localStorage.setItem(this.proofsStorageKey, JSON.stringify(value));
    } catch {
      // Ignore quota errors. Backend URL (if available) will still be used.
    }
  }
}
