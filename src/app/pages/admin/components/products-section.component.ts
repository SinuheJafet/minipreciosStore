import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { jsPDF } from 'jspdf';
import { Product } from '../../../models/product.model';
import { InventoryMovement, MOVEMENT_CONCEPTS } from '../../../models/admin.model';
import { ColumnSource } from '../../../shared/components/dynamic-table/dynamic-table.entities';
import { ProductsAdminService } from '../services/products-admin.service';
import { InventoryAdminService } from '../services/inventory-admin.service';
import { ProductService } from '../../../services/product.service';

interface CompetitorPriceForm {
  platform: string;
  price: number | null;
  url: string;
}

interface ProductForm {
  id: number | null;
  name: string; brand: string; category: string; description: string;
  sku: string; price: number | null; originalPrice: number | null;
  stock: number | null; badge: string; volume: string; tags: string;
  imageUrl: string;
  competitorPrices: CompetitorPriceForm[];
}

const EMPTY_FORM = (): ProductForm => ({
  id: null, name: '', brand: '', category: '', description: '',
  sku: '', price: null, originalPrice: null, stock: null,
  badge: '', volume: '', tags: '', imageUrl: '',
  competitorPrices: [],
});

@Component({
  selector: 'admin-products-section',
  templateUrl: './products-section.component.html',
  styleUrls: ['./products-section.component.scss'],
})
export class ProductsSectionComponent implements OnInit {
  /* ── Observables principales ── */
  filtered$!: Observable<Product[]>;
  movements!: Observable<InventoryMovement[]>;

  private stockFilter$ = new BehaviorSubject<'all' | 'low' | 'out'>('all');
  activeStockFilter: 'all' | 'low' | 'out' = 'all';
  allProducts: Product[] = [];
  allMovements: InventoryMovement[] = [];

  /* ── Tabs ── */
  activeTab: 'catalog' | 'movements' = 'catalog';

  /* ── Modal movimiento ── */
  showMovModal = false;
  movProductId: number | null = null;
  movProductSearch = '';
  showMovDropdown = false;
  movType: 'entrada' | 'salida' | 'ajuste' = 'entrada';
  movConcept = '';
  movQty = 1;
  movNotes = '';
  movLotCode = '';
  concepts: string[] = MOVEMENT_CONCEPTS.entrada;

  get movProductResults(): Product[] {
    const q = this.movProductSearch.toLowerCase().trim();
    const list = q
      ? this.allProducts.filter(p =>
          p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      : this.allProducts;
    return list.slice(0, 10);
  }
  readonly movTypes = [
    { key: 'entrada' as const, label: 'Entrada', icon: '↑' },
    { key: 'salida'  as const, label: 'Salida',  icon: '↓' },
    { key: 'ajuste'  as const, label: 'Ajuste',  icon: '⇄' },
  ];

  /* ── Modal historial por producto ── */
  showHistoryModal = false;
  historyProduct: Product | null = null;
  get historyMovements(): InventoryMovement[] {
    return this.historyProduct
      ? this.allMovements.filter(m => m.productId === this.historyProduct!.id)
      : [];
  }

  constructor(
    private svc: ProductsAdminService,
    private invSvc: InventoryAdminService,
    private productService: ProductService,
  ) {}

  ngOnInit(): void {
    // Merge products + live inventory stock (real-time via BehaviorSubjects de ambos servicios)
    const merged$ = combineLatest([this.svc.getProducts(), this.invSvc.getInventory()]).pipe(
      map(([prods, inv]) => {
        const stockMap = new Map(inv.map(p => [p.id, p.stock]));
        return prods.map(p => ({ ...p, stock: stockMap.has(p.id) ? stockMap.get(p.id)! : p.stock }));
      })
    );
    merged$.subscribe(p => this.allProducts = p);

    this.filtered$ = combineLatest([merged$, this.stockFilter$]).pipe(
      map(([prods, f]) => {
        if (f === 'low') return prods.filter(p => p.stock > 0 && p.stock <= 5);
        if (f === 'out') return prods.filter(p => p.stock === 0);
        return prods;
      })
    );

    this.movements = this.invSvc.getMovements();
    this.movements.subscribe(m => this.allMovements = m);

    this.loadCategories();
  }

  showModal       = false;
  isEdit          = false;
  form: ProductForm = EMPTY_FORM();
  showDeleteConfirm = false;
  deletingProduct: Product | null = null;

  showShareModal  = false;
  sharingProduct: Product | null = null;
  shareCopied     = false;
  isGenerating    = false;
  shareMode: 'image' | 'pdf' = 'image';
  discountPercentInput: number | null = null;

  selectedProducts: Product[] = [];

  categories: string[] = [];
  readonly badges = [
    { value: '', label: '— Sin badge —' },
    { value: 'new',        label: 'New'        },
    { value: 'sale',       label: 'Sale'       },
    { value: 'hot',        label: 'Hot'        },
    { value: 'bestseller', label: 'Bestseller' },
  ];

  columns: ColumnSource[] = [
    { columnDef: 'name', headerName: 'Producto',
      isHtmlTemplate: true, contentTemplate: (r: Product) =>
        `<div class="dt-product-cell">
          ${r.images[0] ? `<img class="dt-thumb" src="${r.images[0]}" alt="">` : `<div class="dt-thumb" style="background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#cbd5e1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`}
          <div><span class="dt-name">${r.name}</span><span class="dt-brand">${r.brand}</span></div>
        </div>` },
    { columnDef: 'sku',      headerName: 'SKU',       isHtmlTemplate: true, contentTemplate: (r: Product) => `<span class="dt-sku">${r.sku}</span>` },
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
        { icon: 'share',   toolTip: 'Compartir',         color: 'op-view',   action: (r: Product) => this.openShare(r) },
        { icon: 'swap_vert', toolTip: 'Registrar movimiento', color: 'op-mov', action: (r: Product) => this.openMovement(r) },
        { icon: 'history', toolTip: 'Historial de stock', color: 'op-hist',  action: (r: Product) => this.openHistory(r) },
        { icon: 'edit',    toolTip: 'Editar',             color: 'op-edit',   action: (r: Product) => this.openEdit(r) },
        { icon: 'delete',  toolTip: 'Eliminar',           color: 'op-delete', action: (r: Product) => this.confirmDelete(r) },
      ]},
  ];

  readonly movColumns: ColumnSource[] = [
    { columnDef: 'createdAt', headerName: 'Fecha',
      cell: (r: InventoryMovement) => r.createdAt.substring(0, 10) },
    { columnDef: 'productName', headerName: 'Producto',
      isHtmlTemplate: true, contentTemplate: (r: InventoryMovement) =>
        `<span style="display:block;font-weight:600;color:#0f172a;font-size:13px">${r.productName}</span>
         <span style="font-family:monospace;font-size:10px;background:#f1f5f9;padding:1px 6px;border-radius:4px;color:#475569">${r.productSku}</span>` },
    { columnDef: 'type', headerName: 'Tipo',
      isHtmlTemplate: true, contentTemplate: (r: InventoryMovement) => {
        const cfg: Record<string,[string,string,string]> = {
          entrada: ['#d1fae5','#059669','↑ Entrada'],
          salida:  ['#fef2f2','#dc2626','↓ Salida'],
          ajuste:  ['#dbeafe','#2563eb','⇄ Ajuste'],
        };
        const [bg, c, lbl] = cfg[r.type] ?? ['#f1f5f9','#64748b', r.type];
        return `<span style="padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;background:${bg};color:${c}">${lbl}</span>`;
      }},
    { columnDef: 'concept',  headerName: 'Concepto', cell: (r: InventoryMovement) => r.concept },
    { columnDef: 'quantity', headerName: 'Cantidad',
      isHtmlTemplate: true, contentTemplate: (r: InventoryMovement) =>
        `<span style="font-weight:700;color:#0f172a">${r.type === 'entrada' ? '+' : r.type === 'salida' ? '-' : ''}${r.quantity}</span>` },
    { columnDef: 'previousStock', headerName: 'Ant.',
      isHtmlTemplate: true, contentTemplate: (r: InventoryMovement) =>
        `<span style="color:#94a3b8;font-size:12px">${r.previousStock}</span>` },
    { columnDef: 'newStock', headerName: 'Nuevo',
      isHtmlTemplate: true, contentTemplate: (r: InventoryMovement) =>
        `<span style="font-weight:600;color:#0f172a;font-size:12px">${r.newStock}</span>` },
    { columnDef: 'createdBy', headerName: 'Por', cell: (r: InventoryMovement) => r.createdBy },
    { columnDef: 'notes', headerName: 'Notas', cell: (r: InventoryMovement) => r.notes || '—' },
  ];

  /* ── Stock filters ── */
  setStockFilter(f: 'all' | 'low' | 'out'): void {
    this.activeStockFilter = f;
    this.stockFilter$.next(f);
  }
  stockCount(f: 'all' | 'low' | 'out'): number {
    if (f === 'all') return this.allProducts.length;
    if (f === 'low') return this.allProducts.filter(p => p.stock > 0 && p.stock <= 5).length;
    return this.allProducts.filter(p => p.stock === 0).length;
  }

  /* ── Movimiento por producto ── */
  openMovement(p?: Product): void {
    this.movProductId = p?.id ?? null;
    this.movProductSearch = p ? `${p.name}  ·  ${p.sku}` : '';
    this.showMovDropdown = false;
    this.movType = 'entrada';
    this.onMovTypeChange();
    this.movQty = 1; this.movNotes = ''; this.movLotCode = '';
    this.showMovModal = true;
  }
  closeMovement(): void {
    this.showMovModal = false;
    this.movProductId = null; this.movProductSearch = ''; this.showMovDropdown = false;
    this.movConcept = ''; this.movQty = 1; this.movNotes = ''; this.movLotCode = '';
  }
  selectMovProduct(p: Product): void {
    this.movProductId = p.id;
    this.movProductSearch = `${p.name}  ·  ${p.sku}`;
    this.showMovDropdown = false;
  }
  onMovSearchBlur(): void {
    // Pequeño delay para que el mousedown del item dispare antes de cerrar
    setTimeout(() => { this.showMovDropdown = false; }, 150);
  }
  onMovTypeChange(): void {
    this.concepts = MOVEMENT_CONCEPTS[this.movType];
    this.movConcept = '';
  }
  saveMovement(): void {
    if (!this.movProductId || !this.movConcept) return;
    const product = this.allProducts.find(p => p.id === this.movProductId);
    if (!product) return;
    const prev = product.stock;
    const newStock = this.movType === 'entrada' ? prev + this.movQty
                   : this.movType === 'salida'  ? Math.max(0, prev - this.movQty)
                   : this.movQty;
    this.invSvc.addMovement({
      productId: product.id, productName: product.name, productSku: product.sku,
      type: this.movType, concept: this.movConcept, quantity: this.movQty,
      notes: this.movNotes, previousStock: prev, newStock,
      createdBy: 'Admin', createdAt: new Date().toISOString(),
      ...(this.movLotCode ? { lotCode: this.movLotCode } : {}),
    });
    this.closeMovement();
  }

  /* ── Historial por producto ── */
  openHistory(p: Product): void { this.historyProduct = p; this.showHistoryModal = true; }
  closeHistory(): void { this.showHistoryModal = false; this.historyProduct = null; }

  /* ── CRUD ── */
  openCreate(): void {
    this.form = EMPTY_FORM();
    this.discountPercentInput = null;
    this.isEdit = false;
    this.showModal = true;
  }

  openEdit(p: Product): void {
    this.form = {
      id: p.id, name: p.name, brand: p.brand, category: p.category,
      description: p.description, sku: p.sku, price: p.price,
      originalPrice: p.originalPrice ?? null, stock: p.stock,
      badge: p.badge ?? '', volume: p.volume ?? '',
      tags: p.tags.join(', '), imageUrl: p.images[0] ?? '',
      competitorPrices: (p.competitorPrices ?? []).map(cp => ({
        platform: cp.platform, price: cp.price, url: cp.url ?? '',
      })),
    };
    this.syncDiscountFromPrices();
    this.isEdit = true;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.discountPercentInput = null;
  }

  saveProduct(): void {
    if (!this.form.name || !this.form.sku || !this.form.category || !this.form.price) return;

    const competitorPrices = this.form.competitorPrices
      .filter(cp => cp.platform && cp.price !== null)
      .map(cp => ({ platform: cp.platform.trim(), price: cp.price!, url: cp.url?.trim() || undefined }));

    const payload: Omit<Product, 'id'> = {
      name: this.form.name, brand: this.form.brand, category: this.form.category,
      description: this.form.description, sku: this.form.sku, price: this.form.price,
      originalPrice: this.form.originalPrice ?? undefined,
      stock: this.form.stock ?? 0,
      badge: (this.form.badge as Product['badge']) || undefined,
      volume: this.form.volume || undefined,
      tags: this.form.tags.split(',').map(t => t.trim()).filter(Boolean),
      images: this.form.imageUrl ? [this.form.imageUrl] : [],
      rating: 0, reviews: 0,
    };

    if (this.isEdit && this.form.id) {
      this.svc.update(this.form.id, payload).pipe(
        switchMap(updated => updated ? this.svc.replaceCompetitorPrices(this.form.id!, competitorPrices) : of(void 0))
      ).subscribe(() => this.closeModal());
      return;
    }

    this.svc.add(payload).pipe(
      switchMap(created => created ? this.svc.replaceCompetitorPrices(created.id, competitorPrices) : of(void 0))
    ).subscribe(() => this.closeModal());
  }

  confirmDelete(p: Product): void { this.deletingProduct = p; this.showDeleteConfirm = true; }
  cancelDelete(): void  { this.deletingProduct = null; this.showDeleteConfirm = false; }
  doDelete(): void      { if (this.deletingProduct) this.svc.remove(this.deletingProduct.id); this.cancelDelete(); }

  /* ── Competitor prices (form) ── */
  addCompetitorPrice(): void    { this.form.competitorPrices.push({ platform: '', price: null, url: '' }); }
  removeCompetitorPrice(i: number): void { this.form.competitorPrices.splice(i, 1); }

  onDiscountPercentChange(): void {
    this.applyDiscountToCurrentPrice();
  }

  canCheckProduct = (p: Product): boolean => p.stock > 0;

  onOriginalPriceChange(): void {
    if (this.discountPercentInput !== null && this.discountPercentInput > 0) {
      this.applyDiscountToCurrentPrice();
      return;
    }
    this.syncDiscountFromPrices();
  }

  syncDiscountFromPrices(): void {
    this.discountPercentInput = this.getDiscountPercent(this.form.price, this.form.originalPrice);
  }

  /* ── Selection ── */
  onChecked(rows: Product[]): void {
    // Compartir masivo: nunca incluir productos agotados.
    this.selectedProducts = rows.filter(p => p.stock > 0);
  }

  /* ── Share modal ── */
  openShare(p: Product): void {
    this.sharingProduct = p;
    this.showShareModal = true;
    this.shareCopied    = false;
    this.isGenerating   = false;
    this.shareMode      = 'image';
  }
  closeShare(): void { this.showShareModal = false; this.sharingProduct = null; }

  discountPct(p: Product): number {
    if (!p.originalPrice) return 0;
    return Math.round((1 - p.price / p.originalPrice) * 100);
  }

  private getDiscountPercent(price: number | null, originalPrice: number | null): number | null {
    if (price === null || originalPrice === null || originalPrice <= 0 || originalPrice <= price) {
      return null;
    }
    return Number(((1 - price / originalPrice) * 100).toFixed(2));
  }

  private applyDiscountToCurrentPrice(): void {
    if (this.discountPercentInput === null) return;
    if (this.form.originalPrice === null || this.form.originalPrice <= 0) return;
    if (this.discountPercentInput < 0 || this.discountPercentInput >= 100) return;

    const currentPrice = this.form.originalPrice * (1 - this.discountPercentInput / 100);
    this.form.price = Number(currentPrice.toFixed(2));
  }

  private loadCategories(): void {
    this.productService.getCategories().subscribe(categories => {
      this.categories = categories.map(c => c.name);
    });
  }

  /* ── Single product: Descargar (imagen o PDF según shareMode) ── */
  async downloadSingle(): Promise<void> {
    if (!this.sharingProduct || this.isGenerating) return;
    this.isGenerating = true;
    try {
      const name = this.safeName(this.sharingProduct.name);
      if (this.shareMode === 'image') {
        const blob = await this.buildImage(this.sharingProduct);
        this.triggerDownload(blob, `${name}-miniprecios.png`);
      } else {
        const blob = await this.buildPDF([this.sharingProduct]);
        this.triggerDownload(blob, `${name}-miniprecios.pdf`);
      }
    } finally { this.isGenerating = false; }
  }

  /* ── Single product: Compartir WhatsApp (imagen o PDF según shareMode) ── */
  async shareWhatsApp(): Promise<void> {
    if (!this.sharingProduct || this.isGenerating) return;
    this.isGenerating = true;
    try {
      const name = this.safeName(this.sharingProduct.name);
      if (this.shareMode === 'image') {
        const blob = await this.buildImage(this.sharingProduct);
        await this.shareOrDownload(blob, `${name}-miniprecios.png`);
      } else {
        const blob = await this.buildPDF([this.sharingProduct]);
        await this.shareOrDownload(blob, `${name}-miniprecios.pdf`);
      }
    } finally { this.isGenerating = false; }
  }

  /* ── Construir imagen PNG (canvas → Blob) ── */
  private async buildImage(product: Product): Promise<Blob> {
    const img = product.images[0] ? await this.loadImage(product.images[0]) : null;
    const canvas = this.renderCanvas(product, img);
    return new Promise<Blob>(resolve => {
      canvas.toBlob(blob => resolve(blob!), 'image/png', 0.96);
    });
  }

  /* ── Download PDF (bulk) ── */
  async downloadBulkPDF(): Promise<void> {
    const selected = this.selectedProducts.filter(p => p.stock > 0);
    if (!selected.length || this.isGenerating) return;
    this.isGenerating = true;
    try {
      const blob = await this.buildPDF(selected);
      this.triggerDownload(blob, `productos-miniprecios-${selected.length}.pdf`);
    } finally { this.isGenerating = false; }
  }

  /* ── Share via WhatsApp / Web Share API (bulk) ── */
  async shareBulkWhatsApp(): Promise<void> {
    const selected = this.selectedProducts.filter(p => p.stock > 0);
    if (!selected.length || this.isGenerating) return;
    this.isGenerating = true;
    try {
      const blob = await this.buildPDF(selected);
      await this.shareOrDownload(blob, `productos-miniprecios-${selected.length}.pdf`);
    } finally { this.isGenerating = false; }
  }

  /* ── Core: build multi-page PDF ── */
  private async buildPDF(products: Product[]): Promise<Blob> {
    const PX2MM = 0.2646;  // 96dpi: 1px = 0.2646mm
    let pdf: jsPDF | null = null;

    for (const p of products) {
      const img     = p.images[0] ? await this.loadImage(p.images[0]) : null;
      const canvas  = this.renderCanvas(p, img);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.93);
      const wMM     = canvas.width  * PX2MM;
      const hMM     = canvas.height * PX2MM;

      // Orientación dinámica según dimensiones del canvas (portrait si alto > ancho)
      const orient = hMM > wMM ? 'p' : 'l';
      if (!pdf) {
        pdf = new jsPDF({ orientation: orient, unit: 'mm', format: [wMM, hMM] });
      } else {
        pdf.addPage([wMM, hMM], orient);
      }
      pdf.addImage(dataUrl, 'JPEG', 0, 0, wMM, hMM);
    }

    return pdf!.output('blob');
  }

  /* ── Web Share API → fallback download ── */
  private async shareOrDownload(blob: Blob, filename: string): Promise<void> {
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'miniprecios' });
        return;
      } catch { /* user cancelled or error → fall through to download */ }
    }
    this.triggerDownload(blob, filename);
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ── Canvas renderer — diseño vertical portrait que coincide con el card del modal ── */
  private renderCanvas(p: Product, productImg: HTMLImageElement | null): HTMLCanvasElement {
    const cpCount = p.competitorPrices?.length ?? 0;
    const W       = 800;
    const HDR_H   = 54;
    const IMG_H   = 380;   // siempre reservar espacio (imagen o placeholder)
    const FTR_H   = 42;
    const PAD     = 30;
    // textH debe coincidir EXACTAMENTE con los cy+= del dibujo:
    // PAD(top) + brand(26) + name(40) + price(58) + divider(20)
    // + competitors: title(16) + rows(46 c/u)
    // + PAD(bottom)
    const textH   = PAD + 26 + 40 + 58 + 20
                  + (cpCount > 0 ? 16 + cpCount * 46 : 0)
                  + PAD;
    const H = HDR_H + IMG_H + textH + FTR_H;

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      if ((ctx as any).roundRect) (ctx as any).roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
    };

    /* ── Fondo blanco ── */
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);

    /* ── Header bar (purple) ── */
    ctx.fillStyle = '#7c3aed'; ctx.fillRect(0, 0, W, HDR_H);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui,sans-serif';
    ctx.fillText('⚡ miniprecios', 24, HDR_H / 2 + 7);
    if (p.badge) {
      const bs = p.badge.toUpperCase();
      ctx.font = 'bold 11px system-ui,sans-serif';
      const bw = ctx.measureText(bs).width + 18;
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath(); rr(W - 24 - bw, 14, bw, 24, 5); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillText(bs, W - 24 - bw + 9, 31);
    }

    /* ── Imagen del producto (contain — se ve completa, sin recorte ni degradado) ── */
    if (productImg) {
      // Fondo neutro para las áreas sin imagen (letterbox)
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, HDR_H, W, IMG_H);
      const iw = productImg.naturalWidth  || productImg.width  || 1;
      const ih = productImg.naturalHeight || productImg.height || 1;
      // contain: escalar para que QUEPA completa dentro del área
      const scale = Math.min(W / iw, IMG_H / ih);
      const dw = iw * scale, dh = ih * scale;
      const dx = (W - dw) / 2;
      const dy = HDR_H + (IMG_H - dh) / 2;
      ctx.drawImage(productImg, dx, dy, dw, dh);
    } else {
      // Placeholder con gradiente
      const pg = ctx.createLinearGradient(0, HDR_H, 0, HDR_H + IMG_H);
      pg.addColorStop(0, '#f5f3ff'); pg.addColorStop(1, '#ede9fe');
      ctx.fillStyle = pg; ctx.fillRect(0, HDR_H, W, IMG_H);
      ctx.fillStyle = '#c4b5fd'; ctx.font = '80px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📦', W / 2, HDR_H + IMG_H / 2 + 28);
      ctx.textAlign = 'left';
    }

    /* ── Contenido de texto ── */
    const px = 32;
    const rw = W - px * 2;
    let cy = HDR_H + IMG_H + PAD;

    // Marca · Volumen
    ctx.fillStyle = '#64748b'; ctx.font = '13px system-ui,sans-serif';
    ctx.fillText(`${p.brand}${p.volume ? '  ·  ' + p.volume : ''}`, px, cy); cy += 26;

    // Nombre del producto
    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 26px system-ui,sans-serif';
    let nameText = p.name;
    while (ctx.measureText(nameText).width > rw && nameText.length > 5)
      nameText = nameText.slice(0, -1);
    if (nameText !== p.name) nameText += '…';
    ctx.fillText(nameText, px, cy); cy += 40;

    // Precio principal
    const priceStr = `$${p.price.toFixed(2)}`;
    ctx.fillStyle = '#7c3aed'; ctx.font = 'bold 36px system-ui,sans-serif';
    ctx.fillText(priceStr, px, cy + 28);
    if (p.originalPrice) {
      const origStr = `$${p.originalPrice.toFixed(2)}`;
      const ox = px + ctx.measureText(priceStr).width + 14;
      ctx.fillStyle = '#94a3b8'; ctx.font = '17px system-ui,sans-serif';
      ctx.fillText(origStr, ox, cy + 24);
      const ow = ctx.measureText(origStr).width;
      ctx.beginPath(); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
      ctx.moveTo(ox, cy + 16); ctx.lineTo(ox + ow, cy + 16); ctx.stroke();
      const pct = `-${this.discountPct(p)}%`;
      ctx.font = 'bold 11px system-ui,sans-serif';
      const pw = ctx.measureText(pct).width + 14;
      ctx.fillStyle = '#d1fae5';
      ctx.beginPath(); rr(ox + ow + 10, cy + 10, pw, 20, 5); ctx.fill();
      ctx.fillStyle = '#059669'; ctx.fillText(pct, ox + ow + 17, cy + 24);
    }
    cy += 58;

    // Divisor
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px, cy); ctx.lineTo(W - px, cy); ctx.stroke();
    cy += 20;

    // Precios de competidores
    if (cpCount > 0) {
      ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 10px system-ui,sans-serif';
      ctx.fillText('COMPARATIVA DE PRECIOS', px, cy); cy += 16;
      p.competitorPrices!.forEach(cp => {
        const cheaper = p.price < cp.price;
        ctx.fillStyle = '#f8fafc'; ctx.beginPath(); rr(px, cy, rw, 36, 8); ctx.fill();
        ctx.fillStyle = '#334155'; ctx.font = '13px system-ui,sans-serif';
        ctx.fillText(cp.platform, px + 13, cy + 23);
        const cpS = `$${cp.price.toFixed(2)}`;
        if (cheaper) {
          const savePct = Math.round((cp.price - p.price) / cp.price * 100);
          const saveS = `Ahorras ${savePct}%`;
          ctx.font = 'bold 10px system-ui,sans-serif';
          const sw = ctx.measureText(saveS).width + 14;
          ctx.fillStyle = '#d1fae5'; ctx.beginPath(); rr(px + rw - sw, cy + 9, sw, 18, 5); ctx.fill();
          ctx.fillStyle = '#059669'; ctx.fillText(saveS, px + rw - sw + 7, cy + 22);
          ctx.font = 'bold 13px system-ui,sans-serif';
          ctx.fillStyle = '#059669';
          ctx.fillText(cpS, px + rw - sw - ctx.measureText(cpS).width - 12, cy + 23);
        } else {
          ctx.font = 'bold 13px system-ui,sans-serif'; ctx.fillStyle = '#0f172a';
          ctx.fillText(cpS, px + rw - ctx.measureText(cpS).width, cy + 23);
        }
        cy += 46;
      });
    }

    /* ── Footer bar ── */
    const footerY = H - FTR_H;
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, footerY, W, FTR_H);
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, footerY); ctx.lineTo(W, footerY); ctx.stroke();
    ctx.fillStyle = '#94a3b8'; ctx.font = '12px system-ui,sans-serif';
    ctx.fillText(
    //miniprecios.com  ·
      `  
      ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      px, footerY + 27
    );

    return canvas;
  }

  private loadImage(url: string): Promise<HTMLImageElement | null> {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const t = setTimeout(() => resolve(null), 4000);
      img.onload  = () => { clearTimeout(t); resolve(img); };
      img.onerror = () => { clearTimeout(t); resolve(null); };
      img.src = url;
    });
  }

  private safeName(name: string): string {
    return name.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 40);
  }
}
