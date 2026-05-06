import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../../../models/product.model';
import { ColumnSource } from '../../../shared/components/dynamic-table/dynamic-table.entities';
import { MOVEMENT_CONCEPTS, PurchaseBatch } from '../../../models/admin.model';
import { InventoryAdminService } from '../services/inventory-admin.service';
import { PurchaseBatchesService } from '../services/purchase-batches.service';

type StockFilter = 'all' | 'low' | 'out';

@Component({
  selector: 'admin-inventory-section',
  templateUrl: './inventory-section.component.html',
  styleUrls: ['./inventory-section.component.scss']
})
export class InventorySectionComponent implements OnInit {
  products!: Observable<Product[]>;
  constructor(private svc: InventoryAdminService, private batchSvc: PurchaseBatchesService) {}

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
  movBatchId: number | null = null;
  allBatches: PurchaseBatch[] = [];
  productBatches: PurchaseBatch[] = [];
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
    this.products = this.svc.getInventory();
    this.products.subscribe(p => this.allList = p);
    this.batchSvc.getBatches().subscribe(b => this.allBatches = b);
    this.filtered$ = combineLatest([this.products, this.stockFilter$]).pipe(
      map(([prods, f]) => {
        if (f === 'low') return prods.filter(p => p.stock > 0 && p.stock <= 5);
        if (f === 'out') return prods.filter(p => p.stock === 0);
        return prods;
      })
    );
  }

  setFilter(f: StockFilter): void { this.activeFilter = f; this.stockFilter$.next(f); }
  count(f: StockFilter): number {
    if (f === 'all') return this.allList.length;
    if (f === 'low') return this.allList.filter(p => p.stock > 0 && p.stock <= 5).length;
    return this.allList.filter(p => p.stock === 0).length;
  }

  openModal(): void { this.showModal = true; this.movType = 'entrada'; this.onTypeChange(); }
  closeModal(): void { this.showModal = false; this.movQty = 1; this.movNotes = ''; this.movConcept = ''; this.movProductId = null; this.movBatchId = null; this.productBatches = []; }
  onTypeChange(): void { this.concepts = MOVEMENT_CONCEPTS[this.movType]; this.movConcept = ''; this.onProductChange(); }

  onProductChange(): void {
    if (this.movType === 'entrada') { this.movBatchId = null; this.productBatches = []; return; }
    const product = this.allList.find(p => p.id === this.movProductId);
    if (!product) { this.movBatchId = null; this.productBatches = []; return; }
    this.productBatches = this.allBatches;
    this.movBatchId = product.batchId ?? null;
  }

  saveMovement(): void {
    if (!this.movProductId || !this.movConcept) return;
    const product = this.allList.find(p => p.id === this.movProductId);
    if (!product) return;
    const prev = product.stock;
    const newStock = this.movType === 'entrada' ? prev + this.movQty
                   : this.movType === 'salida'  ? Math.max(0, prev - this.movQty)
                   : this.movQty;
    const batch = this.movBatchId != null ? this.allBatches.find(b => b.id === this.movBatchId) : undefined;
    this.svc.addMovement({
      productId: product.id, productName: product.name, productSku: product.sku,
      type: this.movType, concept: this.movConcept, quantity: this.movQty,
      lotCode: batch?.code,
      notes: this.movNotes, previousStock: prev, newStock,
      createdBy: 'Admin', createdAt: new Date().toISOString(),
    });
    this.closeModal();
  }
}
