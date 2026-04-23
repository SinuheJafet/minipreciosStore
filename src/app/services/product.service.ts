import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, map, catchError, of } from 'rxjs';
import { Product, Category } from '../models/product.model';
import { environment } from '../../environments/environment';
import { RealtimeService } from './realtime.service';

interface PagedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }

@Injectable({ providedIn: 'root' })
export class ProductService implements OnDestroy {
  private api = environment.apiUrl;
  private _cache = new BehaviorSubject<Product[]>([]);
  private _subs = new Subscription();

  constructor(private http: HttpClient, private rt: RealtimeService) {
    // Update cached products in-place on hub events
    this._subs.add(
      this.rt.on<Product>('ProductUpdated').subscribe(p => {
        if (!this._cache.value.length) return;
        this._cache.next(this._cache.value.map(x => x.id === p.id ? p : x));
      })
    );
    this._subs.add(
      this.rt.on<Product>('ProductCreated').subscribe(p => {
        if (!this._cache.value.length) return;
        this._cache.next([...this._cache.value, p]);
      })
    );
    this._subs.add(
      this.rt.on<{ id: number }>('ProductDeleted').subscribe(({ id }) => {
        if (!this._cache.value.length) return;
        this._cache.next(this._cache.value.filter(x => x.id !== id));
      })
    );
  }

  getProducts(params?: { category?: string; q?: string; filter?: string; sort?: string; maxPrice?: number; page?: number; pageSize?: number }): Observable<Product[]> {
    let p = new HttpParams().set('pageSize', params?.pageSize ?? 100);
    if (params?.category) p = p.set('category', params.category);
    if (params?.q)        p = p.set('q', params.q);
    if (params?.filter)   p = p.set('filter', params.filter);
    if (params?.sort)     p = p.set('sort', params.sort);
    if (params?.maxPrice) p = p.set('maxPrice', params.maxPrice);
    if (params?.page)     p = p.set('page', params.page);
    return this.http.get<PagedResponse<Product>>(`${this.api}/products`, { params: p }).pipe(
      map(res => {
        const list = res.data;
        // Prime the cache with the full list (no filter params) so hub patches work
        if (!params?.category && !params?.q && !params?.filter) {
          this._cache.next(list);
        }
        return list;
      }),
      catchError(() => of([]))
    );
  }

  getProductById(id: number): Observable<Product | undefined> {
    return this.http.get<Product>(`${this.api}/products/${id}`).pipe(
      catchError(() => of(undefined))
    );
  }

  getFeaturedProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.api}/products/featured`).pipe(
      catchError(() => of([]))
    );
  }

  getSaleProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.api}/products/sale`).pipe(
      catchError(() => of([]))
    );
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.api}/categories`).pipe(
      catchError(() => of([]))
    );
  }

  searchProducts(query: string): Observable<Product[]> {
    return this.getProducts({ q: query });
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    return this.getProducts({ category });
  }

  /** Live stream of all cached products — use in components that need real-time updates */
  get products$(): Observable<Product[]> {
    return this._cache.asObservable();
  }

  ngOnDestroy(): void { this._subs.unsubscribe(); }
}
