import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from 'src/app/models/product.model';
import { InventoryMovement } from '../../../models/admin.model';
import { environment } from '../../../../environments/environment';

interface InvProductDto {
  id: number; name: string; brand: string; sku: string;
  category: string; image: string; stock: number;
}

interface PagedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }

function mapToProduct(p: InvProductDto): Product {
  return {
    id: p.id, name: p.name, brand: p.brand, sku: p.sku,
    category: p.category, stock: p.stock,
    images: p.image ? [p.image] : [],
    description: '', price: 0, rating: 0, reviews: 0, tags: [],
  };
}

@Injectable({ providedIn: 'root' })
export class InventoryAdminService {
  private _inventory  = new BehaviorSubject<Product[]>([]);
  private _movements  = new BehaviorSubject<InventoryMovement[]>([]);
  private api = `${environment.apiUrl}/inventory`;

  constructor(private http: HttpClient) {}

  getInventory(): Observable<Product[]> {
    this.loadInventory();
    return this._inventory.asObservable();
  }

  getMovements(): Observable<InventoryMovement[]> {
    this.loadMovements();
    return this._movements.asObservable();
  }

  get lowStockCount$(): Observable<number> {
    return this._inventory.pipe(map(p => p.filter(x => x.stock > 0 && x.stock <= 5).length));
  }

  addMovement(movement: Omit<InventoryMovement, 'id'>): void {
    const body = {
      productId: movement.productId,
      type:      movement.type,
      concept:   movement.concept,
      quantity:  movement.quantity,
      lotCode:   movement.lotCode,
      notes:     movement.notes,
    };
    this.http.post(`${this.api}/movements`, body).pipe(catchError(() => of(null)))
      .subscribe(() => { this.loadInventory(); this.loadMovements(); });
  }

  private loadInventory(): void {
    this.http.get<PagedResponse<InvProductDto> | InvProductDto[]>(this.api).pipe(
      map(res => Array.isArray(res) ? res : res.data),
      catchError(() => of([] as InvProductDto[]))
    ).subscribe(list => this._inventory.next(list.map(mapToProduct)));
  }

  private loadMovements(): void {
    this.http.get<InventoryMovement[]>(`${this.api}/movements`).pipe(catchError(() => of([] as InventoryMovement[])))
      .subscribe(list => this._movements.next(list));
  }
}
