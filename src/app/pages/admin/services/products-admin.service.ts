import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from 'src/app/models/product.model';
import { environment } from '../../../../environments/environment';

interface PagedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }

@Injectable({ providedIn: 'root' })
export class ProductsAdminService {
  private _data = new BehaviorSubject<Product[]>([]);
  private api = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

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
    this.http.post<Product>(this.api, product).pipe(catchError(() => of(null)))
      .subscribe(() => this.load());
  }

  update(id: number, patch: Partial<Product>): void {
    this.http.put<Product>(`${this.api}/${id}`, patch).pipe(catchError(() => of(null)))
      .subscribe(() => this.load());
  }

  remove(id: number): void {
    this.http.delete(`${this.api}/${id}`).pipe(catchError(() => of(null)))
      .subscribe(() => this.load());
  }
}
