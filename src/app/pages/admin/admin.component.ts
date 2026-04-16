import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { Product, CompetitorPrice } from '../../models/product.model';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  products: Product[] = [];
  showModal = false;
  editingProduct: Product | null = null;
  deleteConfirmId: number | null = null;
  productForm: FormGroup;
  formError = '';

  // Image management (managed outside FormGroup)
  imageUrls: string[] = [];
  urlInputValue = '';
  imageDragOver = false;

  // Competitor prices
  competitorPrices: CompetitorPrice[] = [];
  newCompetitor = { platform: 'Amazon', price: null as number | null, url: '' };
  competitorError = '';

  readonly CATEGORIES = [
    { slug: 'oral-care',  label: 'Higiene Oral' },
    { slug: 'skincare',   label: 'Cuidado de Piel' },
    { slug: 'body-care',  label: 'Cuidado Corporal' },
    { slug: 'hair-care',  label: 'Cuidado Capilar' },
    { slug: 'makeup',     label: 'Maquillaje' },
    { slug: 'fragrances', label: 'Fragancias' },
    { slug: 'baby',       label: 'Cuidado Bebé' },
  ];

  readonly BADGES = [
    { value: '',           label: 'Sin etiqueta' },
    { value: 'new',        label: 'Nuevo' },
    { value: 'sale',       label: 'Oferta' },
    { value: 'hot',        label: 'Tendencia' },
    { value: 'bestseller', label: 'Más vendido' },
  ];

  readonly PLATFORMS = [
    'Amazon', 'El Corte Inglés', 'Carrefour', 'Mercadona',
    'Druni', 'Primor', 'Sephora', 'Douglas', 'Perfumerías If', 'Dia', 'Otro',
  ];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private authService: AuthService,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      name:          ['', Validators.required],
      brand:         ['', Validators.required],
      category:      ['', Validators.required],
      description:   ['', Validators.required],
      sku:           ['', Validators.required],
      price:         [null, [Validators.required, Validators.min(0.01)]],
      originalPrice: [null, Validators.min(0.01)],
      stock:         [null, [Validators.required, Validators.min(0)]],
      badge:         [''],
      volume:        [''],
      tags:          [''],
      certifications:[''],
    });
  }

  ngOnInit(): void { this.loadProducts(); }

  loadProducts(): void {
    this.productService.getProducts().subscribe(p => this.products = p);
  }

  get stats() {
    return {
      total:      this.products.length,
      onSale:     this.products.filter(p => p.originalPrice).length,
      lowStock:   this.products.filter(p => p.stock <= 10).length,
      categories: new Set(this.products.map(p => p.category)).size,
    };
  }

  categoryLabel(slug: string): string {
    return this.CATEGORIES.find(c => c.slug === slug)?.label ?? slug;
  }

  badgeLabel(badge?: string): string {
    return this.BADGES.find(b => b.value === (badge ?? ''))?.label ?? '';
  }

  discount(product: Product): number {
    if (!product.originalPrice) return 0;
    return Math.round((1 - product.price / product.originalPrice) * 100);
  }

  // ── Modal open/close ──────────────────────────────────────────────────────

  openAdd(): void {
    this.editingProduct = null;
    this.productForm.reset({ badge: '', category: '' });
    this.imageUrls = [];
    this.urlInputValue = '';
    this.competitorPrices = [];
    this.newCompetitor = { platform: 'Amazon', price: null, url: '' };
    this.formError = '';
    this.competitorError = '';
    this.showModal = true;
  }

  openEdit(product: Product): void {
    this.editingProduct = product;
    this.imageUrls = [...product.images];
    this.urlInputValue = '';
    this.competitorPrices = product.competitorPrices ? [...product.competitorPrices] : [];
    this.newCompetitor = { platform: 'Amazon', price: null, url: '' };
    this.formError = '';
    this.competitorError = '';
    this.productForm.patchValue({
      name:          product.name,
      brand:         product.brand,
      category:      product.category,
      description:   product.description,
      sku:           product.sku,
      price:         product.price,
      originalPrice: product.originalPrice ?? null,
      stock:         product.stock,
      badge:         product.badge ?? '',
      volume:        product.volume ?? '',
      tags:          product.tags.join(', '),
      certifications:(product.certifications ?? []).join(', '),
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingProduct = null;
  }

  // ── Image management ──────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) this.imageUrls.push(result);
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.imageDragOver = true;
  }

  onDragLeave(): void {
    this.imageDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.imageDragOver = false;
    const files = event.dataTransfer?.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) this.imageUrls.push(result);
      };
      reader.readAsDataURL(file);
    });
  }

  addImageUrl(): void {
    const url = this.urlInputValue.trim();
    if (url && !this.imageUrls.includes(url)) {
      this.imageUrls.push(url);
      this.urlInputValue = '';
    }
  }

  removeImage(index: number): void {
    this.imageUrls.splice(index, 1);
  }

  // ── Competitor prices ─────────────────────────────────────────────────────

  addCompetitor(): void {
    this.competitorError = '';
    if (!this.newCompetitor.platform) { this.competitorError = 'Selecciona una plataforma'; return; }
    if (!this.newCompetitor.price || this.newCompetitor.price <= 0) { this.competitorError = 'Precio no válido'; return; }
    this.competitorPrices.push({
      platform:  this.newCompetitor.platform,
      price:     +this.newCompetitor.price,
      url:       this.newCompetitor.url.trim() || undefined,
      updatedAt: new Date().toLocaleDateString('es-ES'),
    });
    this.newCompetitor = { platform: 'Amazon', price: null, url: '' };
  }

  removeCompetitor(index: number): void {
    this.competitorPrices.splice(index, 1);
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  saveProduct(): void {
    this.formError = '';
    if (this.productForm.invalid) { this.productForm.markAllAsTouched(); return; }
    if (this.imageUrls.length === 0) { this.formError = 'Añade al menos una imagen al producto'; return; }
    const v = this.productForm.value;
    const op = v.originalPrice ? +v.originalPrice : undefined;
    if (op && op <= +v.price) { this.formError = 'El precio original debe ser mayor que el precio actual'; return; }

    const data: Omit<Product, 'id'> = {
      name:            v.name.trim(),
      brand:           v.brand.trim(),
      category:        v.category,
      description:     v.description.trim(),
      sku:             v.sku.trim(),
      price:           +v.price,
      originalPrice:   op,
      stock:           +v.stock,
      badge:           v.badge || undefined,
      volume:          v.volume?.trim() || undefined,
      images:          this.imageUrls,
      tags:            v.tags ? v.tags.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      certifications:  v.certifications ? v.certifications.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      competitorPrices:this.competitorPrices.length > 0 ? [...this.competitorPrices] : undefined,
      rating:          this.editingProduct?.rating ?? 0,
      reviews:         this.editingProduct?.reviews ?? 0,
    };

    if (this.editingProduct) {
      this.productService.updateProduct(this.editingProduct.id, data);
    } else {
      this.productService.addProduct(data);
    }
    this.loadProducts();
    this.closeModal();
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  confirmDelete(id: number): void { this.deleteConfirmId = id; }
  cancelDelete(): void { this.deleteConfirmId = null; }

  doDelete(): void {
    if (this.deleteConfirmId !== null) {
      this.productService.deleteProduct(this.deleteConfirmId);
      this.deleteConfirmId = null;
      this.loadProducts();
    }
  }

  // ── Quick actions ─────────────────────────────────────────────────────────

  toggleSale(product: Product): void {
    if (product.originalPrice) {
      this.productService.updateProduct(product.id, { originalPrice: undefined });
    } else {
      this.productService.updateProduct(product.id, {
        originalPrice: +(product.price * 1.3).toFixed(2),
        badge: 'sale',
      });
    }
    this.loadProducts();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  get adminName(): string { return this.authService.currentUser?.name || 'Admin'; }

  @HostListener('keydown.escape')
  onEscape(): void {
    if (this.showModal) this.closeModal();
    if (this.deleteConfirmId !== null) this.cancelDelete();
  }
}
