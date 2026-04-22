import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { Product } from 'src/app/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductsAdminService {
  private baseUrl = '/api/products';

  constructor(private api: ApiService) {}

  getProducts(): Observable<Product[]> {
    // MOCK: Devuelve productos de ejemplo si no hay backend
    return of([
      {
        id: 1,
        name: 'Café Orgánico',
        description: 'Café 100% arábica, orgánico, 500g',
        price: 120,
        images: [],
        category: 'Bebidas',
        brand: 'EcoBeans',
        rating: 4.7,
        reviews: 12,
        stock: 8,
        badge: 'bestseller',
        tags: ['café', 'orgánico'],
        sku: 'ECO-CAFE-500',
      },
      {
        id: 2,
        name: 'Aceite de Oliva Extra Virgen',
        description: 'Botella 1L, prensado en frío',
        price: 210,
        images: [],
        category: 'Aceites',
        brand: 'Olivar',
        rating: 4.9,
        reviews: 8,
        stock: 3,
        badge: 'sale',
        tags: ['aceite', 'oliva'],
        sku: 'OLIVAR-1L',
      }
    ]);
    // Para producción, usar:
    // return this.api.get<Product[]>(this.baseUrl);
  }

  getProduct(id: number): Observable<Product> {
    return this.api.get<Product>(`${this.baseUrl}/${id}`);
  }

  createProduct(product: Product): Observable<Product> {
    return this.api.post<Product>(this.baseUrl, product);
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.api.put<Product>(`${this.baseUrl}/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }
}
