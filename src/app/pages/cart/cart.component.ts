import { Component, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { Cart } from '../../models/cart.model';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cart!: Cart;
  couponInput = '';
  couponError = '';
  couponSuccess = '';

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.cartService.cart$.subscribe(cart => this.cart = cart);
  }

  updateQty(productId: number, qty: number): void {
    this.cartService.updateQuantity(productId, qty);
  }

  remove(productId: number): void {
    this.cartService.removeItem(productId);
  }

  applyCoupon(): void {
    this.couponError = '';
    this.couponSuccess = '';
    if (this.cartService.applyCoupon(this.couponInput)) {
      this.couponSuccess = `Cupón "${this.couponInput.toUpperCase()}" aplicado correctamente`;
    } else {
      this.couponError = 'Cupón inválido. Prueba: MINI10, SAVE20 o FLASH30';
    }
  }

  removeCoupon(): void {
    this.cartService.removeCoupon();
    this.couponInput = '';
    this.couponSuccess = '';
  }
}
