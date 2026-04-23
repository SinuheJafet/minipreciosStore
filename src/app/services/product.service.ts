import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { Product, Category } from '../models/product.model';
import { environment } from '../../environments/environment';

interface PagedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }

@Injectable({ providedIn: 'root' })
export class ProductService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProducts(params?: { category?: string; q?: string; filter?: string; sort?: string; maxPrice?: number; page?: number; pageSize?: number }): Observable<Product[]> {
    let p = new HttpParams().set('pageSize', params?.pageSize ?? 100);
    if (params?.category) p = p.set('category', params.category);
    if (params?.q)        p = p.set('q', params.q);
    if (params?.filter)   p = p.set('filter', params.filter);
    if (params?.sort)     p = p.set('sort', params.sort);
    if (params?.maxPrice) p = p.set('maxPrice', params.maxPrice);
    if (params?.page)     p = p.set('page', params.page);
    return this.http.get<PagedResponse<Product>>(`${this.api}/products`, { params: p }).pipe(
      map(res => res.data),
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
}
