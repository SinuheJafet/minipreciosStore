import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, catchError, forkJoin, map as rxMap, of, switchMap, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from 'src/app/models/product.model';
import { environment } from '../../../../environments/environment';
import { RealtimeService } from '../../../services/realtime.service';

interface PagedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }
interface CompetitorPricePayload { platform: string; price: number; url?: string; }

@Injectable({ providedIn: 'root' })
export class ProductsAdminService implements OnDestroy {
  private _data = new BehaviorSubject<Product[]>([]);
  private api = `${environment.apiUrl}/products`;
  private _subs = new Subscription();

  constructor(private http: HttpClient, private rt: RealtimeService) {
    this._subs.add(
      this.rt.on<Product>('ProductCreated').subscribe(p => {
        this._data.next([...this._data.value, p]);
      })
    );
    this._subs.add(
      this.rt.on<Partial<Product> & { id: number }>('ProductUpdated').subscribe(p => {
        this._data.next(this._data.value.map(x => x.id === p.id ? { ...x, ...p } : x));
      })
    );
    this._subs.add(
      this.rt.on<{ id: number }>('ProductDeleted').subscribe(({ id }) => {
        this._data.next(this._data.value.filter(x => x.id !== id));
      })
    );
  }

  getProducts(): Observable<Product[]> {
    this.load();
    return this._data.asObservable();
  }

  private load(): void {
    const p = new HttpParams().set('pageSize', 200);
    this.http.get<PagedResponse<Product>>(this.api, { params: p }).pipe(
      map(res => {
        if (!res || !Array.isArray(res.data)) {
          console.warn('[ProductsAdminService] Unexpected response shape:', res);
          return [] as Product[];
        }
        return res.data;
      }),
      catchError(err => {
        console.error('[ProductsAdminService] load() failed:', err.status, err.message, err);
        return of([] as Product[]);
      })
    ).subscribe(data => this._data.next(data));
  }

  getById(id: number): Observable<Product | undefined> {
    return this.http.get<Product>(`${this.api}/${id}`).pipe(
      catchError(() => of(undefined))
    );
  }

  add(product: Omit<Product, 'id'>): Observable<Product | null> {
    return this.http.post<Product>(this.api, product).pipe(
      catchError(() => of(null))
    );
  }

  update(id: number, patch: Partial<Product>): Observable<Product | null> {
    return this.http.put<Product>(`${this.api}/${id}`, patch).pipe(
      catchError(() => of(null))
    );
  }

  reload(): void { this.load(); }

  /** Parcha el caché local inmediatamente (antes de que responda el backend) */
  patchLocal(id: number, changes: Partial<Product>): void {
    this._data.next(this._data.value.map(p => p.id === id ? { ...p, ...changes } : p));
  }

  addCompetitorPrice(productId: number, payload: CompetitorPricePayload): Observable<unknown> {
    return this.http.post(`${this.api}/${productId}/competitor-prices`, payload).pipe(
      catchError(() => of(null))
    );
  }

  deleteCompetitorPrice(productId: number, priceId: number): Observable<unknown> {
    return this.http.delete(`${this.api}/${productId}/competitor-prices/${priceId}`).pipe(
      catchError(() => of(null))
    );
  }

  replaceCompetitorPrices(productId: number, desired: CompetitorPricePayload[]): Observable<void> {
    return this.getById(productId).pipe(
      switchMap(product => {
        const existing = (product?.competitorPrices ?? []).filter(cp => cp.id != null);
        const deletes = existing.map(cp => this.deleteCompetitorPrice(productId, cp.id!));
        const adds = desired.map(cp => this.addCompetitorPrice(productId, cp));
        const ops = [...deletes, ...adds];

        if (!ops.length) {
          return this.touchProduct(productId).pipe(rxMap(() => void 0));
        }

        return forkJoin(ops).pipe(
          switchMap(() => this.touchProduct(productId)),
          rxMap(() => void 0)
        );
      }),
      tap(() => this.load()),
      catchError(() => {
        this.load();
        return of(void 0);
      })
    );
  }

  private touchProduct(productId: number): Observable<unknown> {
    // Triggers ProductUpdated broadcast in backends where competitor-prices endpoints do not emit hub events.
    return this.http.put(`${this.api}/${productId}`, {}).pipe(
      catchError(() => of(null))
    );
  }

  remove(id: number): void {
    // Hub will push ProductDeleted → no manual reload needed
    this.http.delete(`${this.api}/${id}`).pipe(catchError(() => of(null)))
      .subscribe(res => { if (res === null) this.load(); });
  }

  ngOnDestroy(): void { this._subs.unsubscribe(); }
}
