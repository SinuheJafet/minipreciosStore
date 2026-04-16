import { Component, OnInit } from '@angular/core';
import { WishlistService } from '../../services/wishlist.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-wishlist',
  template: `
    <div class="wishlist-page">
      <h1>Lista de deseos</h1>
      <div *ngIf="items.length === 0" class="empty">
        <p>💛 Tu lista de deseos está vacía</p>
        <a routerLink="/products">Explorar productos</a>
      </div>
      <div class="grid" *ngIf="items.length > 0">
        <app-product-card *ngFor="let p of items" [product]="p"></app-product-card>
      </div>
    </div>
  `,
  styles: [`
    .wishlist-page { max-width: 1400px; margin: 100px auto 60px; padding: 0 24px;
      h1 { font-size: 32px; font-weight: 800; margin-bottom: 32px; } }
    .empty { text-align: center; padding: 60px; p { font-size: 18px; margin-bottom: 16px; }
      a { color: var(--primary); font-weight: 600; } }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;
      @media (max-width: 1024px) { grid-template-columns: repeat(3, 1fr); }
      @media (max-width: 768px) { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class WishlistComponent implements OnInit {
  items: Product[] = [];

  constructor(private wishlistService: WishlistService) {}

  ngOnInit(): void {
    this.wishlistService.items$.subscribe(items => this.items = items);
  }
}
