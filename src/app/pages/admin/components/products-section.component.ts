import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../../../models/product.model';
import { ColumnSource } from '../../../shared/components/dynamic-table/dynamic-table.entities';

interface ProductForm {
  id: number | null;
  name: string; brand: string; category: string; description: string;
  sku: string; price: number | null; originalPrice: number | null;
  stock: number | null; badge: string; volume: string; tags: string;
  imageUrl: string;
}

const EMPTY_FORM = (): ProductForm => ({
  id: null, name: '', brand: '', category: '', description: '',
  sku: '', price: null, originalPrice: null, stock: null,
  badge: '', volume: '', tags: '', imageUrl: '',
});

@Component({
  selector: 'admin-products-section',
  templateUrl: './products-section.component.html',
  styleUrls: ['./products-section.component.scss'],
})
export class ProductsSectionComponent {
  @Input() products!: Observable<Product[]>;

  showModal = false;
  isEdit = false;
  form: ProductForm = EMPTY_FORM();
  showDeleteConfirm = false;
  deletingProduct: Product | null = null;

  readonly categories = ['Bebidas', 'Aceites', 'Skincare', 'Capilar', 'Maquillaje', 'Fragancias', 'Bebé', 'Higiene Oral', 'Cuidado Corporal', 'Otro'];
  readonly badges = [{ value: '', label: '— Sin badge —' }, { value: 'new', label: 'New' }, { value: 'sale', label: 'Sale' }, { value: 'hot', label: 'Hot' }, { value: 'bestseller', label: 'Bestseller' }];

  columns: ColumnSource[] = [
    { columnDef: 'name', headerName: 'Producto',
      isHtmlTemplate: true, contentTemplate: (r: Product) =>
        `<div class="dt-product-cell">
          ${r.images[0] ? `<img class="dt-thumb" src="${r.images[0]}" alt="">` : `<div class="dt-thumb" style="background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#cbd5e1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`}
          <div><span class="dt-name">${r.name}</span><span class="dt-brand">${r.brand}</span></div>
        </div>` },
    { columnDef: 'sku',      headerName: 'SKU',      isHtmlTemplate: true, contentTemplate: (r: Product) => `<span class="dt-sku">${r.sku}</span>` },
    { columnDef: 'category', headerName: 'Categoría', isHtmlTemplate: true, contentTemplate: (r: Product) => `<span class="dt-cat-pill">${r.category}</span>` },
    { columnDef: 'price',    headerName: 'Precio',
      isHtmlTemplate: true, contentTemplate: (r: Product) =>
        `<span class="dt-price">$${r.price.toFixed(2)}</span>${r.originalPrice ? `<span class="dt-orig">$${r.originalPrice.toFixed(2)}</span>` : ''}` },
    { columnDef: 'stock',    headerName: 'Stock',
      isHtmlTemplate: true, contentTemplate: (r: Product) =>
        `<span class="dt-stock-pill${r.stock <= 5 ? ' low' : ''}">${r.stock === 0 ? 'Agotado' : r.stock + ' uds'}</span>` },
    { columnDef: 'badge',    headerName: 'Badge',
      isHtmlTemplate: true, contentTemplate: (r: Product) =>
        r.badge ? `<span class="dt-badge dt-badge--${r.badge}">${r.badge}</span>` : `<span class="dt-badge dt-badge--none">—</span>` },
    { columnDef: 'ops', headerName: '', operations: [
        { icon: 'edit',   toolTip: 'Editar',   color: 'op-edit',   action: (r: Product) => this.openEdit(r) },
        { icon: 'delete', toolTip: 'Eliminar', color: 'op-delete', action: (r: Product) => this.confirmDelete(r) },
      ]},
  ];

  openCreate(): void { this.form = EMPTY_FORM(); this.isEdit = false; this.showModal = true; }

  openEdit(p: Product): void {
    this.form = {
      id: p.id, name: p.name, brand: p.brand, category: p.category,
      description: p.description, sku: p.sku, price: p.price,
      originalPrice: p.originalPrice ?? null, stock: p.stock,
      badge: p.badge ?? '', volume: p.volume ?? '',
      tags: p.tags.join(', '), imageUrl: p.images[0] ?? '',
    };
    this.isEdit = true;
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  saveProduct(): void {
    if (!this.form.name || !this.form.sku || !this.form.price) return;
    // In production: call ProductsAdminService.createProduct / updateProduct
    this.closeModal();
  }

  confirmDelete(p: Product): void { this.deletingProduct = p; this.showDeleteConfirm = true; }
  cancelDelete(): void { this.deletingProduct = null; this.showDeleteConfirm = false; }
  doDelete(): void {
    // In production: call ProductsAdminService.deleteProduct(this.deletingProduct!.id)
    this.cancelDelete();
  }

  onChecked(rows: Product[]): void { /* handle bulk */ }
}
