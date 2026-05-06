import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ColumnSource } from '../../../shared/components/dynamic-table/dynamic-table.entities';
import { Kit } from '../../../models/kit.model';
import { Product } from '../../../models/product.model';
import { KitsAdminService } from '../services/kits-admin.service';
import { ProductsAdminService } from '../services/products-admin.service';

interface KitForm {
  id: number | null;
  name: string;
  sku: string;
  description: string;
  price: number | null;
  originalPrice: number | null;
  imageUrl: string;
  badge: string;
  isActive: boolean;
  items: { productId: number | null; quantity: number }[];
}

const EMPTY_FORM = (): KitForm => ({
  id: null,
  name: '',
  sku: '',
  description: '',
  price: null,
  originalPrice: null,
  imageUrl: '',
  badge: '',
  isActive: true,
  items: [],
});

@Component({
  selector: 'admin-kits-section',
  templateUrl: './kits-section.component.html',
  styleUrls: ['./kits-section.component.scss'],
})
export class KitsSectionComponent implements OnInit {
  kits$!: Observable<Kit[]>;
  allProducts: Product[] = [];
  showModal = false;
  isEdit = false;
  form: KitForm = EMPTY_FORM();
  showDeleteConfirm = false;
  deletingKit: Kit | null = null;

  columns: ColumnSource[] = [
    {
      columnDef: 'name',
      headerName: 'Nombre',
      isHtmlTemplate: true,
      contentTemplate: (r: Kit) =>
        `<span style="font-weight:600;color:#0f172a;font-size:13px">${r.name}</span>` +
        (r.badge ? `<span style="display:inline-block;margin-left:6px;padding:1px 7px;border-radius:99px;font-size:10px;font-weight:700;background:#ede9fe;color:#7c3aed">${r.badge}</span>` : ''),
    },
    {
      columnDef: 'sku',
      headerName: 'SKU',
      isHtmlTemplate: true,
      contentTemplate: (r: Kit) =>
        `<span style="font-family:monospace;font-size:11px;background:#f1f5f9;color:#64748b;padding:2px 7px;border-radius:5px">${r.sku}</span>`,
    },
    {
      columnDef: 'price',
      headerName: 'Precio',
      isHtmlTemplate: true,
      contentTemplate: (r: Kit) =>
        `<span style="font-weight:700;color:#0f172a">$${r.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>`,
    },
    {
      columnDef: 'items',
      headerName: 'Componentes',
      cell: (r: Kit) => `${r.items?.length ?? 0} productos`,
    },
    {
      columnDef: 'isActive',
      headerName: 'Activo',
      isHtmlTemplate: true,
      contentTemplate: (r: Kit) =>
        r.isActive
          ? `<span style="padding:2px 10px;border-radius:99px;font-size:11px;font-weight:600;background:#dcfce7;color:#166534">Sí</span>`
          : `<span style="padding:2px 10px;border-radius:99px;font-size:11px;font-weight:600;background:#f1f5f9;color:#64748b">No</span>`,
    },
    {
      columnDef: 'ops',
      headerName: '',
      operations: [
        { icon: 'edit', toolTip: 'Editar', color: 'op-edit', action: (r: Kit) => this.openEdit(r) },
        { icon: 'delete', toolTip: 'Eliminar', color: 'op-delete', action: (r: Kit) => this.confirmDelete(r) },
      ],
    },
  ];

  constructor(private svc: KitsAdminService, private prodSvc: ProductsAdminService) {}

  ngOnInit(): void {
    this.kits$ = this.svc.getKits();
    this.prodSvc.getProducts().subscribe(p => (this.allProducts = p));
  }

  openCreate(): void {
    this.form = EMPTY_FORM();
    this.isEdit = false;
    this.showModal = true;
  }

  openEdit(kit: Kit): void {
    this.form = {
      id: kit.id,
      name: kit.name,
      sku: kit.sku,
      description: kit.description ?? '',
      price: kit.price,
      originalPrice: kit.originalPrice ?? null,
      imageUrl: kit.imageUrl ?? '',
      badge: kit.badge ?? '',
      isActive: kit.isActive,
      items: (kit.items ?? []).map(i => ({ productId: i.productId, quantity: i.quantity })),
    };
    this.isEdit = true;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  addItem(): void {
    this.form.items.push({ productId: null, quantity: 1 });
  }

  removeItem(index: number): void {
    this.form.items.splice(index, 1);
  }

  productName(productId: number | null): string {
    if (!productId) return '';
    return this.allProducts.find(p => p.id === productId)?.name ?? '';
  }

  kitTotal(items: { productId: number | null; quantity: number }[]): number {
    return items.reduce((sum, item) => {
      const product = this.allProducts.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  }

  get isFormValid(): boolean {
    return !!(this.form.name && this.form.sku && this.form.price != null && this.form.price > 0);
  }

  saveKit(): void {
    if (!this.isFormValid) return;

    const payload: Omit<Kit, 'id'> = {
      name: this.form.name,
      sku: this.form.sku,
      description: this.form.description || undefined,
      price: this.form.price!,
      originalPrice: this.form.originalPrice ?? undefined,
      imageUrl: this.form.imageUrl || undefined,
      badge: this.form.badge || undefined,
      isActive: this.form.isActive,
      items: this.form.items
        .filter(i => i.productId != null)
        .map(i => ({
          productId: i.productId!,
          productName: this.productName(i.productId),
          quantity: i.quantity,
        })),
    };

    if (this.isEdit && this.form.id) {
      this.svc.update(this.form.id, payload).subscribe(() => this.closeModal());
    } else {
      this.svc.add(payload).subscribe(() => this.closeModal());
    }
  }

  confirmDelete(kit: Kit): void {
    this.deletingKit = kit;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.deletingKit = null;
    this.showDeleteConfirm = false;
  }

  doDelete(): void {
    if (this.deletingKit) {
      this.svc.remove(this.deletingKit.id);
    }
    this.cancelDelete();
  }

  trackByIndex(index: number): number {
    return index;
  }
}
