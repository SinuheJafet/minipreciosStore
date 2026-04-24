import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { Product } from '../../models/product.model';
import { RealtimeService } from '../../services/realtime.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: Product | undefined;
  relatedProducts: Product[] = [];
  selectedImage = 0;
  quantity = 1;
  addedToCart = false;
  activeTab = 'description';
  private currentProductId: number | null = null;
  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private rt: RealtimeService
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.route.params.subscribe(params => {
        const id = +params['id'];
        this.currentProductId = id;
        this.loadProduct(id);
      })
    );

    this.subs.add(
      this.rt.on<Partial<Product> & { id: number }>('ProductUpdated').subscribe(updated => {
        if (this.product && this.product.id === updated.id) {
          this.product = this.mergeProductUpdate(this.product, updated);
        }
        this.relatedProducts = this.relatedProducts.map(p => p.id === updated.id ? this.mergeProductUpdate(p, updated) : p);

        const hasCompetitorPricesField = Object.prototype.hasOwnProperty.call(updated, 'competitorPrices');
        const hasImages = Array.isArray(updated.images)
          && updated.images.some(img => typeof img === 'string' && img.trim().length > 0);
        if (!hasCompetitorPricesField || !hasImages) {
          this.subs.add(
            this.productService.getProductById(updated.id).subscribe(full => {
              if (!full) return;
              if (this.product && this.product.id === full.id) {
                this.product = this.mergeProductUpdate(this.product, full);
              }
              this.relatedProducts = this.relatedProducts.map(p => p.id === full.id ? this.mergeProductUpdate(p, full) : p);
            })
          );
        }
      })
    );

    this.subs.add(
      this.rt.on<{ productId: number; stock: number }>('InventoryChanged').subscribe(({ productId, stock }) => {
        if (this.product && this.product.id === productId) {
          this.product = { ...this.product, stock };
          if (this.quantity > stock) {
            this.quantity = stock > 0 ? stock : 1;
          }
        }
        this.relatedProducts = this.relatedProducts.map(p => p.id === productId ? { ...p, stock } : p);
      })
    );

    this.subs.add(
      this.rt.on<{ id: number }>('ProductDeleted').subscribe(({ id }) => {
        if (this.currentProductId === id) {
          this.router.navigate(['/products']);
          return;
        }
        this.relatedProducts = this.relatedProducts.filter(p => p.id !== id);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get isWishlisted(): boolean {
    return !!this.product && this.wishlistService.isWishlisted(this.product.id);
  }

  get discountPercent(): number {
    if (!this.product?.originalPrice) return 0;
    return Math.round((1 - this.product.price / this.product.originalPrice) * 100);
  }

  addToCart(): void {
    if (!this.product) return;
    this.cartService.addItem(this.product, this.quantity);
    this.addedToCart = true;
    setTimeout(() => this.addedToCart = false, 2000);
  }

  buyNow(): void {
    if (!this.product) return;
    this.cartService.addItem(this.product, this.quantity);
    this.router.navigate(['/checkout']);
  }

  toggleWishlist(): void {
    if (this.product) this.wishlistService.toggle(this.product);
  }

  private loadProduct(id: number): void {
    this.subs.add(
      this.productService.getProductById(id).subscribe(product => {
        if (!product) { this.router.navigate(['/404']); return; }
        this.product = product;
        this.selectedImage = 0;
        this.subs.add(
          this.productService.getProductsByCategory(product.category).subscribe(related => {
            this.relatedProducts = related.filter(p => p.id !== id).slice(0, 4);
          })
        );
      })
    );
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
