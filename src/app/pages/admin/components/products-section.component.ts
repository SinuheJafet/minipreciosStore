import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { jsPDF } from 'jspdf';
import { Product } from '../../../models/product.model';
import { ColumnSource } from '../../../shared/components/dynamic-table/dynamic-table.entities';
import { ProductsAdminService } from '../services/products-admin.service';

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
  products!: Observable<Product[]>;

  constructor(private svc: ProductsAdminService) {}

  ngOnInit(): void { this.products = this.svc.getProducts(); }

  showModal       = false;
  isEdit          = false;
  form: ProductForm = EMPTY_FORM();
  showDeleteConfirm = false;
  deletingProduct: Product | null = null;

  showShareModal  = false;
  sharingProduct: Product | null = null;
  shareCopied     = false;
  isGenerating    = false;

  selectedProducts: Product[] = [];

  readonly categories = [];
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
        { icon: 'share',  toolTip: 'Compartir', color: 'op-view',   action: (r: Product) => this.openShare(r) },
        { icon: 'edit',   toolTip: 'Editar',    color: 'op-edit',   action: (r: Product) => this.openEdit(r) },
        { icon: 'delete', toolTip: 'Eliminar',  color: 'op-delete', action: (r: Product) => this.confirmDelete(r) },
      ]},
  ];

  /* ── CRUD ── */
  openCreate(): void { this.form = EMPTY_FORM(); this.isEdit = false; this.showModal = true; }

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
    this.isEdit = true;
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  saveProduct(): void {
    if (!this.form.name || !this.form.sku || !this.form.price) return;
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
      competitorPrices: this.form.competitorPrices
        .filter(cp => cp.platform && cp.price !== null)
        .map(cp => ({ platform: cp.platform, price: cp.price!, url: cp.url || undefined,
                      updatedAt: new Date().toISOString().slice(0, 10) })),
    };
    if (this.isEdit && this.form.id) this.svc.update(this.form.id, payload);
    else this.svc.add(payload);
    this.closeModal();
  }

  confirmDelete(p: Product): void { this.deletingProduct = p; this.showDeleteConfirm = true; }
  cancelDelete(): void  { this.deletingProduct = null; this.showDeleteConfirm = false; }
  doDelete(): void      { if (this.deletingProduct) this.svc.remove(this.deletingProduct.id); this.cancelDelete(); }

  /* ── Competitor prices (form) ── */
  addCompetitorPrice(): void    { this.form.competitorPrices.push({ platform: '', price: null, url: '' }); }
  removeCompetitorPrice(i: number): void { this.form.competitorPrices.splice(i, 1); }

  /* ── Selection ── */
  onChecked(rows: Product[]): void { this.selectedProducts = rows; }

  /* ── Share modal ── */
  openShare(p: Product): void {
    this.sharingProduct = p;
    this.showShareModal = true;
    this.shareCopied    = false;
    this.isGenerating   = false;
  }
  closeShare(): void { this.showShareModal = false; this.sharingProduct = null; }

  discountPct(p: Product): number {
    if (!p.originalPrice) return 0;
    return Math.round((1 - p.price / p.originalPrice) * 100);
  }

  /* ── Download PDF (single product) ── */
  async downloadSinglePDF(): Promise<void> {
    if (!this.sharingProduct || this.isGenerating) return;
    this.isGenerating = true;
    try {
      const blob = await this.buildPDF([this.sharingProduct]);
      this.triggerDownload(blob, `${this.safeName(this.sharingProduct.name)}-miniprecios.pdf`);
    } finally { this.isGenerating = false; }
  }

  /* ── Share via WhatsApp / Web Share API (single) ── */
  async shareWhatsApp(): Promise<void> {
    if (!this.sharingProduct || this.isGenerating) return;
    this.isGenerating = true;
    try {
      const blob = await this.buildPDF([this.sharingProduct]);
      await this.shareOrDownload(blob, `${this.safeName(this.sharingProduct.name)}-miniprecios.pdf`);
    } finally { this.isGenerating = false; }
  }

  /* ── Download PDF (bulk) ── */
  async downloadBulkPDF(): Promise<void> {
    if (!this.selectedProducts.length || this.isGenerating) return;
    this.isGenerating = true;
    try {
      const blob = await this.buildPDF(this.selectedProducts);
      this.triggerDownload(blob, `productos-miniprecios-${this.selectedProducts.length}.pdf`);
    } finally { this.isGenerating = false; }
  }

  /* ── Share via WhatsApp / Web Share API (bulk) ── */
  async shareBulkWhatsApp(): Promise<void> {
    if (!this.selectedProducts.length || this.isGenerating) return;
    this.isGenerating = true;
    try {
      const blob = await this.buildPDF(this.selectedProducts);
      await this.shareOrDownload(blob, `productos-miniprecios-${this.selectedProducts.length}.pdf`);
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

      if (!pdf) {
        pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: [wMM, hMM] });
      } else {
        pdf.addPage([wMM, hMM]);
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

  /* ── Canvas renderer ── */
  private renderCanvas(p: Product, productImg: HTMLImageElement | null): HTMLCanvasElement {
    const cpCount  = p.competitorPrices?.length ?? 0;
    const W        = 800;
    const IMG_W    = 240;
    const HDR_H    = 50;
    const FTR_H    = 36;
    const contentH = Math.max(260, 168 + (p.description ? 18 : 0) + cpCount * 42 + (cpCount ? 28 : 0));
    const H        = HDR_H + contentH + FTR_H;

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      if ((ctx as any).roundRect) (ctx as any).roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
    };

    /* BG */
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    /* Header */
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(0, 0, W, HDR_H);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px system-ui,sans-serif';
    ctx.fillText('⚡ miniprecios', 22, 33);

    if (p.badge) {
      ctx.font = 'bold 11px system-ui,sans-serif';
      const bs = p.badge.toUpperCase();
      const bw = ctx.measureText(bs).width + 18;
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath(); rr(W - 22 - bw, 13, bw, 24, 5); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(bs, W - 22 - bw + 9, 30);
    }

    /* Image column */
    if (productImg) {
      ctx.save();
      ctx.beginPath(); ctx.rect(0, HDR_H, IMG_W, contentH); ctx.clip();
      const scale = Math.max(IMG_W / productImg.width, contentH / productImg.height);
      const dw = productImg.width * scale, dh = productImg.height * scale;
      ctx.drawImage(productImg, (IMG_W - dw) / 2, HDR_H + (contentH - dh) / 2, dw, dh);
      const grad = ctx.createLinearGradient(IMG_W - 30, 0, IMG_W, 0);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(1, 'rgba(255,255,255,1)');
      ctx.fillStyle = grad; ctx.fillRect(IMG_W - 30, HDR_H, 30, contentH);
      ctx.restore();
    } else {
      ctx.fillStyle = '#f3f0ff'; ctx.fillRect(0, HDR_H, IMG_W, contentH);
      ctx.fillStyle = '#c4b5fd'; ctx.font = '56px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📦', IMG_W / 2, HDR_H + contentH / 2 + 20);
      ctx.textAlign = 'left';
    }

    /* Separator */
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(IMG_W, HDR_H); ctx.lineTo(IMG_W, HDR_H + contentH); ctx.stroke();

    /* Right content */
    const rx = IMG_W + 24;
    const rw = W - rx - 22;
    let ry   = HDR_H + 26;

    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 20px system-ui,sans-serif';
    ctx.fillText(p.name.length > 46 ? p.name.slice(0, 46) + '…' : p.name, rx, ry); ry += 26;

    ctx.fillStyle = '#64748b'; ctx.font = '13px system-ui,sans-serif';
    ctx.fillText(`${p.brand}${p.volume ? ' · ' + p.volume : ''}`, rx, ry); ry += 18;

    if (p.description) {
      ctx.fillStyle = '#94a3b8'; ctx.font = '11px system-ui,sans-serif';
      ctx.fillText(p.description.length > 86 ? p.description.slice(0, 86) + '…' : p.description, rx, ry);
      ry += 18;
    }
    ry += 8;

    ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 10px system-ui,sans-serif';
    ctx.fillText('NUESTRO PRECIO', rx, ry); ry += 14;

    ctx.fillStyle = '#7c3aed'; ctx.font = 'bold 34px system-ui,sans-serif';
    const mainP = `$${p.price.toFixed(2)}`;
    ctx.fillText(mainP, rx, ry + 28);

    if (p.originalPrice) {
      const ox = rx + ctx.measureText(mainP).width + 12;
      ctx.fillStyle = '#94a3b8'; ctx.font = '16px system-ui,sans-serif';
      const orig = `$${p.originalPrice.toFixed(2)}`;
      ctx.fillText(orig, ox, ry + 26);
      const ow = ctx.measureText(orig).width;
      ctx.beginPath(); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
      ctx.moveTo(ox, ry + 19); ctx.lineTo(ox + ow, ry + 19); ctx.stroke();
      ctx.font = 'bold 11px system-ui,sans-serif';
      const pct = `-${this.discountPct(p)}%`;
      const pw = ctx.measureText(pct).width + 12;
      ctx.fillStyle = '#d1fae5';
      ctx.beginPath(); rr(ox + ow + 8, ry + 10, pw, 18, 4); ctx.fill();
      ctx.fillStyle = '#059669'; ctx.fillText(pct, ox + ow + 14, ry + 23);
    }
    ry += 52;

    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(W - 22, ry); ctx.stroke();
    ry += 14;

    if (cpCount > 0) {
      ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 10px system-ui,sans-serif';
      ctx.fillText('COMPARATIVA DE PRECIOS', rx, ry); ry += 12;

      p.competitorPrices!.forEach(cp => {
        const cheaper = p.price < cp.price;
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath(); rr(rx, ry, rw, 34, 7); ctx.fill();

        ctx.fillStyle = '#334155'; ctx.font = '12px system-ui,sans-serif';
        ctx.fillText(cp.platform, rx + 11, ry + 22);

        const cpS = `$${cp.price.toFixed(2)}`;
        if (cheaper) {
          const savePct = Math.round((cp.price - p.price) / cp.price * 100);
          const saveS = `Ahorras ${savePct}%`;
          ctx.font = 'bold 10px system-ui,sans-serif';
          const sw = ctx.measureText(saveS).width + 12;
          ctx.fillStyle = '#d1fae5';
          ctx.beginPath(); rr(rx + rw - sw, ry + 9, sw, 16, 4); ctx.fill();
          ctx.fillStyle = '#059669'; ctx.fillText(saveS, rx + rw - sw + 6, ry + 21);
          ctx.font = 'bold 12px system-ui,sans-serif';
          const cw = ctx.measureText(cpS).width;
          ctx.fillStyle = '#059669'; ctx.fillText(cpS, rx + rw - sw - cw - 10, ry + 22);
        } else {
          ctx.font = 'bold 12px system-ui,sans-serif';
          ctx.fillStyle = '#0f172a';
          const cw = ctx.measureText(cpS).width;
          ctx.fillText(cpS, rx + rw - cw, ry + 22);
        }
        ry += 40;
      });
    }

    /* Footer */
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, H - FTR_H, W, FTR_H);
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath(); ctx.moveTo(0, H - FTR_H); ctx.lineTo(W, H - FTR_H); ctx.stroke();
    ctx.fillStyle = '#94a3b8'; ctx.font = '11px system-ui,sans-serif';
    ctx.fillText(`miniprecios.com · ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`,
                 22, H - FTR_H + 23);

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
