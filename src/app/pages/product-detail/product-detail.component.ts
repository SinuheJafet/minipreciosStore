import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product: Product | undefined;
  relatedProducts: Product[] = [];
  selectedImage = 0;
  quantity = 1;
  addedToCart = false;
  activeTab = 'description';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.productService.getProductById(id).subscribe(product => {
        if (!product) { this.router.navigate(['/404']); return; }
        this.product = product;
        this.selectedImage = 0;
        this.productService.getProductsByCategory(product.category).subscribe(related => {
          this.relatedProducts = related.filter(p => p.id !== id).slice(0, 4);
        });
      });
    });
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
}
