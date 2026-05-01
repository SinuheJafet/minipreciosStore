import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of } from 'rxjs';
import { PurchaseBatch } from '../../../models/admin.model';
import { Product } from '../../../models/product.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PurchaseBatchesService {
  private _data = new BehaviorSubject<PurchaseBatch[]>([]);
  private api = `${environment.apiUrl}/purchase-batches`;

  constructor(private http: HttpClient) {}

  getBatches(): Observable<PurchaseBatch[]> {
    this.load();
    return this._data.asObservable();
  }

  add(batch: Omit<PurchaseBatch, 'id' | 'createdAt'>): void {
    const payload = { ...batch, totalInvested: Number(batch.totalInvested) };
    this.http.post<PurchaseBatch>(this.api, payload)
      .pipe(catchError(() => of(null)))
      .subscribe(() => this.load());
  }

  remove(id: number): void {
    this.http.delete(`${this.api}/${id}`)
      .pipe(catchError(() => of(null)))
      .subscribe(() => this.load());
  }

  /** Calcula el ROI del lote a partir de los productos actuales en memoria */
  computeStats(batch: PurchaseBatch, allProducts: Product[]): PurchaseBatch {
    const linked = allProducts.filter(p => p.batchId === batch.id);
    const totalRevenuePotential = linked.reduce((s, p) => s + p.price * p.stock, 0);
    const roi = batch.totalInvested > 0
      ? ((totalRevenuePotential - batch.totalInvested) / batch.totalInvested) * 100
      : 0;
    return { ...batch, productCount: linked.length, totalRevenuePotential, roi };
  }

  /** Genera un código sugerido para el nuevo lote */
  suggestCode(existing: PurchaseBatch[]): string {
    const year = new Date().getFullYear();
    const max = existing
      .map(b => parseInt(b.code.split('-').pop() ?? '0', 10))
      .reduce((m, n) => Math.max(m, n), 0);
    return `LOTE-${year}-${String(max + 1).padStart(3, '0')}`;
  }

  private load(): void {
    this.http.get<PurchaseBatch[]>(this.api)
      .pipe(catchError(() => of([] as PurchaseBatch[])))
      .subscribe(list => this._data.next(list));
  }
}
