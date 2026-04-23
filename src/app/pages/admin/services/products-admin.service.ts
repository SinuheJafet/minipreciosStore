import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from 'src/app/models/product.model';
import { environment } from '../../../../environments/environment';
import { RealtimeService } from '../../../services/realtime.service';

interface PagedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }

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
      this.rt.on<Product>('ProductUpdated').subscribe(p => {
        this._data.next(this._data.value.map(x => x.id === p.id ? p : x));
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
      map(res => res.data),
      catchError(() => of([] as Product[]))
    ).subscribe(data => this._data.next(data));
  }

  add(product: Omit<Product, 'id'>): void {
    // Hub will push ProductCreated → no manual reload needed
    this.http.post<Product>(this.api, product).pipe(catchError(() => of(null)))
      .subscribe(created => { if (!created) this.load(); });
  }

  update(id: number, patch: Partial<Product>): void {
    // Hub will push ProductUpdated → no manual reload needed
    this.http.put<Product>(`${this.api}/${id}`, patch).pipe(catchError(() => of(null)))
      .subscribe(updated => { if (!updated) this.load(); });
  }

  remove(id: number): void {
    // Hub will push ProductDeleted → no manual reload needed
    this.http.delete(`${this.api}/${id}`).pipe(catchError(() => of(null)))
      .subscribe(res => { if (res === null) this.load(); });
  }

  ngOnDestroy(): void { this._subs.unsubscribe(); }
}
