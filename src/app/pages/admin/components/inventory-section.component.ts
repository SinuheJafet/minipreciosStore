import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../../../models/product.model';
import { ColumnSource } from '../../../shared/components/dynamic-table/dynamic-table.entities';
import { MOVEMENT_CONCEPTS } from '../../../models/admin.model';

type StockFilter = 'all' | 'low' | 'out';

@Component({
  selector: 'admin-inventory-section',
  templateUrl: './inventory-section.component.html',
  styleUrls: ['./inventory-section.component.scss']
})
export class InventorySectionComponent implements OnInit {
  @Input() products!: Observable<Product[]>;
  @Input() allProducts!: Observable<Product[]>;

  stockFilter$ = new BehaviorSubject<StockFilter>('all');
  filtered$!: Observable<Product[]>;
  activeFilter: StockFilter = 'all';
  allList: Product[] = [];

  showModal = false;
  movType: 'entrada' | 'salida' | 'ajuste' = 'entrada';
  movProductId: number | null = null;
  movConcept = '';
  movQty = 1;
  movNotes = '';
  concepts: string[] = MOVEMENT_CONCEPTS.entrada;
  movTypes = [
    { key: 'entrada', label: 'Entrada', icon: '↑' },
    { key: 'salida',  label: 'Salida',  icon: '↓' },
    { key: 'ajuste',  label: 'Ajuste',  icon: '⇄' },
  ] as const;

  columns: ColumnSource[] = [
    { columnDef: 'name', headerName: 'Producto',
      isHtmlTemplate: true, contentTemplate: (r: Product) =>
        `<div class="dt-product-cell">
          ${r.images[0] ? `<img class="dt-thumb" src="${r.images[0]}" alt="">` : `<div class="dt-thumb" style="background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#cbd5e1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`}
          <div><span class="dt-name">${r.name}</span><span class="dt-brand">${r.brand}</span></div>
        </div>` },
    { columnDef: 'sku',      headerName: 'SKU',
      isHtmlTemplate: true, contentTemplate: (r: Product) => `<span class="dt-sku">${r.sku}</span>` },
    { columnDef: 'category', headerName: 'Categoría',
      isHtmlTemplate: true, contentTemplate: (r: Product) => `<span class="dt-cat-pill">${r.category}</span>` },
    { columnDef: 'stock',    headerName: 'Stock',
      isHtmlTemplate: true, contentTemplate: (r: Product) => {
        const cls = r.stock === 0 ? 'dt-inv-status--out' : r.stock <= 5 ? 'dt-inv-status--low' : 'dt-inv-status--normal';
        const lbl = r.stock === 0 ? 'Agotado' : r.stock <= 5 ? `${r.stock} uds — Bajo` : `${r.stock} uds`;
        return `<span class="dt-inv-status ${cls}">${lbl}</span>`;
      }},
  ];

  ngOnInit(): void {
    this.products.subscribe(p => this.allList = p);
    this.filtered$ = combineLatest([this.products, this.stockFilter$]).pipe(
      map(([prods, f]) => {
        if (f === 'low') return prods.filter(p => p.stock > 0 && p.stock <= 5);
        if (f === 'out') return prods.filter(p => p.stock === 0);
        return prods;
      })
    );
    if (this.allProducts) this.allProducts.subscribe(p => this.allList = p);
  }

  setFilter(f: StockFilter): void { this.activeFilter = f; this.stockFilter$.next(f); }
  count(f: StockFilter): number {
    if (f === 'all') return this.allList.length;
    if (f === 'low') return this.allList.filter(p => p.stock > 0 && p.stock <= 5).length;
    return this.allList.filter(p => p.stock === 0).length;
  }

  openModal(): void { this.showModal = true; this.movType = 'entrada'; this.onTypeChange(); }
  closeModal(): void { this.showModal = false; this.movQty = 1; this.movNotes = ''; this.movConcept = ''; this.movProductId = null; }
  onTypeChange(): void { this.concepts = MOVEMENT_CONCEPTS[this.movType]; this.movConcept = ''; }

  saveMovement(): void {
    if (!this.movProductId || !this.movConcept) return;
    // In production: call InventoryAdminService.addMovement(...)
    this.closeModal();
  }
}
