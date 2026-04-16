import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../../models/product.model';
import { CartService } from '../../../services/cart.service';
import { WishlistService } from '../../../services/wishlist.service';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input() product!: Product;
  addedToCart = false;

  constructor(
    private cartService: CartService,
    private wishlistService: WishlistService,
    private router: Router
  ) {}

  get isWishlisted(): boolean {
    return this.wishlistService.isWishlisted(this.product.id);
  }

  get discountPercent(): number {
    if (!this.product.originalPrice) return 0;
    return Math.round((1 - this.product.price / this.product.originalPrice) * 100);
  }

  addToCart(e: Event): void {
    e.stopPropagation();
    this.cartService.addItem(this.product);
    this.addedToCart = true;
    setTimeout(() => this.addedToCart = false, 2000);
  }

  toggleWishlist(e: Event): void {
    e.stopPropagation();
    this.wishlistService.toggle(this.product);
  }

  goToDetail(): void {
    this.router.navigate(['/products', this.product.id]);
  }
}
