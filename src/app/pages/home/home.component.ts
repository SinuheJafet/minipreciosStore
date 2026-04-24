import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product, Category } from '../../models/product.model';
import { BannersAdminService } from '../admin/services/banners-admin.service';
import { AdminBanner } from '../../models/admin.model';
import { Subscription } from 'rxjs';
import { RealtimeService } from '../../services/realtime.service';

interface HeroBanner {
  title: string; subtitle: string; cta: string; link: string;
  filter: string; bg: string; img: string; bgColor: string; textColor: string;
}

const DEFAULT_BANNERS: HeroBanner[] = [
  { title: 'Cuídate sin gastar de más', subtitle: 'Hasta 40% de descuento en higiene y cuidado personal. Las mejores marcas al mejor precio', cta: 'Explorar ofertas', link: '/products', filter: 'sale', bg: 'gradient-1', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80', bgColor: '', textColor: '' },
  { title: 'Skincare que realmente funciona', subtitle: 'CeraVe, La Roche-Posay, Nivea y más. Tu piel merece lo mejor', cta: 'Ver skincare', link: '/products', filter: '', bg: 'gradient-2', img: 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600&q=80', bgColor: '', textColor: '' },
  { title: 'Tu rutina de belleza completa', subtitle: 'Maquillaje, fragancias y cuidado corporal. Todo en un solo lugar', cta: 'Ver maquillaje', link: '/products', filter: '', bg: 'gradient-3', img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80', bgColor: '', textColor: '' },
];

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  featuredProducts: Product[] = [];
  saleProducts: Product[] = [];
  categories: Category[] = [];

  banners: HeroBanner[] = DEFAULT_BANNERS;
  activeBanner = 0;
  promoBanner: AdminBanner | null = null;
  private subs = new Subscription();
  private bannerIntervalId: ReturnType<typeof setInterval> | null = null;
  get promoBannerBg(): string | null {
    const c = this.promoBanner?.bgColor;
    return c ? `linear-gradient(135deg,${c} 0%,${c}bb 100%)` : null;
  }

  highlights = [
    { icon: '🚚', title: 'Envío gratis', desc: 'En pedidos +50€' },
    { icon: '🔄', title: 'Devolución fácil', desc: '30 días sin preguntas' },
    { icon: '🛡️', title: 'Garantía total', desc: '2 años en todos los productos' },
    { icon: '💬', title: 'Soporte 24/7', desc: 'Asistencia siempre disponible' },
  ];

  constructor(
    private productService: ProductService,
    private router: Router,
    private bannersService: BannersAdminService,
    private rt: RealtimeService,
  ) {}

  ngOnInit(): void {
    this.subs.add(this.productService.getFeaturedProducts().subscribe(p => this.featuredProducts = p.slice(0, 4)));
    this.subs.add(this.productService.getSaleProducts().subscribe(p => this.saleProducts = p.slice(0, 4)));
    this.subs.add(this.productService.getCategories().subscribe(c => this.categories = c));

    this.subs.add(this.bannersService.getPublicBanners('hero').subscribe(heroBanners => {
      this.banners = heroBanners.length
        ? heroBanners.sort((a, b) => a.position - b.position).map(b => ({
            title: b.title, subtitle: b.subtitle, cta: b.ctaText, link: b.ctaLink,
            filter: '', bg: '', img: b.imageUrl, bgColor: b.bgColor, textColor: b.textColor,
          }))
        : DEFAULT_BANNERS;
      if (this.activeBanner >= this.banners.length) this.activeBanner = 0;
    }));

    this.subs.add(this.bannersService.getPublicBanners('promo').subscribe(promoBanners => {
      this.promoBanner = promoBanners.sort((a, b) => a.position - b.position)[0] ?? null;
    }));

    this.subs.add(
      this.rt.on<Product>('ProductUpdated').subscribe(updated => {
        this.featuredProducts = this.featuredProducts.map(p => p.id === updated.id ? this.mergeProductUpdate(p, updated) : p);
        this.saleProducts = this.saleProducts.map(p => p.id === updated.id ? this.mergeProductUpdate(p, updated) : p);

        const hasCompetitorPricesField = Object.prototype.hasOwnProperty.call(updated, 'competitorPrices');
        const hasImages = Array.isArray((updated as Partial<Product>).images)
          && ((updated as Partial<Product>).images ?? []).some(img => typeof img === 'string' && img.trim().length > 0);
        if (!hasCompetitorPricesField || !hasImages) {
          this.subs.add(
            this.productService.getProductById(updated.id).subscribe(full => {
              if (!full) return;
              this.featuredProducts = this.featuredProducts.map(p => p.id === full.id ? this.mergeProductUpdate(p, full) : p);
              this.saleProducts = this.saleProducts.map(p => p.id === full.id ? this.mergeProductUpdate(p, full) : p);
            })
          );
        }
      })
    );

    this.subs.add(
      this.rt.on<{ productId: number; stock: number }>('InventoryChanged').subscribe(({ productId, stock }) => {
        this.featuredProducts = this.featuredProducts.map(p => p.id === productId ? { ...p, stock } : p);
        this.saleProducts = this.saleProducts.map(p => p.id === productId ? { ...p, stock } : p);
      })
    );

    this.subs.add(
      this.rt.on<{ id: number }>('ProductDeleted').subscribe(({ id }) => {
        this.featuredProducts = this.featuredProducts.filter(p => p.id !== id);
        this.saleProducts = this.saleProducts.filter(p => p.id !== id);
      })
    );

    this.bannerIntervalId = setInterval(() => {
      this.activeBanner = (this.activeBanner + 1) % this.banners.length;
    }, 5000);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.bannerIntervalId) {
      clearInterval(this.bannerIntervalId);
      this.bannerIntervalId = null;
    }
  }

  goToCategory(slug: string): void {
    this.router.navigate(['/products'], { queryParams: { category: slug } });
  }

  trackByProductId(_: number, p: Product): number {
    return p.id;
  }

  private mergeProductUpdate(base: Product, patch: Partial<Product> & { id: number }): Product {
    const merged = { ...base, ...patch } as Product;
    const hasImagesField = Object.prototype.hasOwnProperty.call(patch, 'images');
    const hasValidImages = Array.isArray((patch as Partial<Product>).images)
      && ((patch as Partial<Product>).images ?? []).some(img => typeof img === 'string' && img.trim().length > 0);
    if (!hasImagesField || !hasValidImages) {
      merged.images = base.images;
    }
    const hasCompetitorPricesField = Object.prototype.hasOwnProperty.call(patch, 'competitorPrices');
    if (!hasCompetitorPricesField) {
      merged.competitorPrices = base.competitorPrices;
    }
    return merged;
  }
}
