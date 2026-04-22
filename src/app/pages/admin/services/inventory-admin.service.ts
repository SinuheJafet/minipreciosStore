import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { InventoryMovement } from '../../../models/admin.model';
import { Product } from 'src/app/models/product.model';

@Injectable({ providedIn: 'root' })
export class InventoryAdminService {
  private baseUrl = '/api/inventory';
  constructor(private api: ApiService) {}

  getInventory(): Observable<Product[]> {
    return of([
      { id: 1, name: 'Café Orgánico', description: '', price: 120, images: [],
        category: 'Bebidas', brand: 'EcoBeans', rating: 4.7, reviews: 12,
        stock: 8, badge: 'bestseller', tags: [], sku: 'ECO-CAFE-500' },
      { id: 2, name: 'Aceite de Oliva Extra Virgen', description: '', price: 210, images: [],
        category: 'Aceites', brand: 'Olivar', rating: 4.9, reviews: 8,
        stock: 3, badge: 'sale', tags: [], sku: 'OLIVAR-1L' },
      { id: 3, name: 'Crema Hidratante', description: '', price: 89, images: [],
        category: 'Skincare', brand: 'NaturaCare', rating: 4.5, reviews: 24,
        stock: 0, badge: undefined, tags: [], sku: 'NC-CREMA-100' },
      { id: 4, name: 'Shampoo Premium', description: '', price: 145, images: [],
        category: 'Capilar', brand: 'HairPlus', rating: 4.3, reviews: 18,
        stock: 22, badge: 'new', tags: [], sku: 'HP-SHAM-300' },
    ]);
  }

  getMovements(): Observable<InventoryMovement[]> {
    return of([
      { id: 1, productId: 1, productName: 'Café Orgánico', productSku: 'ECO-CAFE-500',
        type: 'entrada', concept: 'Compra a proveedor', quantity: 20,
        notes: 'Lote marzo 2026', previousStock: 0, newStock: 20,
        createdBy: 'Carlos Ruiz', createdAt: '2026-04-01T09:00:00' },
      { id: 2, productId: 2, productName: 'Aceite de Oliva Extra Virgen', productSku: 'OLIVAR-1L',
        type: 'entrada', concept: 'Compra a proveedor', quantity: 10,
        notes: '', previousStock: 0, newStock: 10,
        createdBy: 'Carlos Ruiz', createdAt: '2026-04-01T09:05:00' },
      { id: 3, productId: 1, productName: 'Café Orgánico', productSku: 'ECO-CAFE-500',
        type: 'salida', concept: 'Venta', quantity: 12,
        notes: 'ORD-001, ORD-003', previousStock: 20, newStock: 8,
        createdBy: 'Sistema', createdAt: '2026-04-20T14:30:00' },
      { id: 4, productId: 2, productName: 'Aceite de Oliva Extra Virgen', productSku: 'OLIVAR-1L',
        type: 'salida', concept: 'Venta', quantity: 7,
        notes: 'ORD-002, ORD-003, ORD-004', previousStock: 10, newStock: 3,
        createdBy: 'Sistema', createdAt: '2026-04-21T10:00:00' },
      { id: 5, productId: 3, productName: 'Crema Hidratante', productSku: 'NC-CREMA-100',
        type: 'salida', concept: 'Merma / daño', quantity: 5,
        notes: 'Producto caducado', previousStock: 5, newStock: 0,
        createdBy: 'María López', createdAt: '2026-04-22T08:00:00' },
    ]);
  }

  updateStock(id: number, stock: number): Observable<Product> {
    return this.api.put<Product>(`${this.baseUrl}/${id}/stock`, { stock });
  }

  addMovement(movement: Omit<InventoryMovement, 'id'>): Observable<InventoryMovement> {
    return this.api.post<InventoryMovement>(`${this.baseUrl}/movements`, movement);
  }
}
