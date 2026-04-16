import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Cart, CartItem } from '../models/cart.model';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly SHIPPING_THRESHOLD = 50;
  private readonly SHIPPING_COST = 9.99;
  private readonly COUPONS: Record<string, number> = {
    'MINI10': 10, 'SAVE20': 20, 'FLASH30': 30
  };

  private cartSubject = new BehaviorSubject<Cart>(this.emptyCart());
  cart$ = this.cartSubject.asObservable();

  private emptyCart(): Cart {
    return { items: [], subtotal: 0, discount: 0, shipping: 0, total: 0 };
  }

  addItem(product: Product, quantity = 1): void {
    const cart = this.cartSubject.value;
    const existing = cart.items.find(i => i.product.id === product.id);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, product.stock);
    } else {
      cart.items.push({ product, quantity });
    }
    this.recalculate(cart);
  }

  removeItem(productId: number): void {
    const cart = this.cartSubject.value;
    cart.items = cart.items.filter(i => i.product.id !== productId);
    this.recalculate(cart);
  }

  updateQuantity(productId: number, quantity: number): void {
    const cart = this.cartSubject.value;
    const item = cart.items.find(i => i.product.id === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
        return;
      }
      item.quantity = Math.min(quantity, item.product.stock);
      this.recalculate(cart);
    }
  }

  applyCoupon(code: string): boolean {
    const discount = this.COUPONS[code.toUpperCase()];
    if (discount) {
      const cart = this.cartSubject.value;
      cart.couponCode = code.toUpperCase();
      cart.discount = discount;
      this.recalculate(cart);
      return true;
    }
    return false;
  }

  removeCoupon(): void {
    const cart = this.cartSubject.value;
    delete cart.couponCode;
    cart.discount = 0;
    this.recalculate(cart);
  }

  clearCart(): void {
    this.cartSubject.next(this.emptyCart());
  }

  get itemCount(): number {
    return this.cartSubject.value.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  private recalculate(cart: Cart): void {
    cart.subtotal = cart.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const discountAmount = cart.subtotal * (cart.discount / 100);
    const discounted = cart.subtotal - discountAmount;
    cart.shipping = discounted > this.SHIPPING_THRESHOLD ? 0 : this.SHIPPING_COST;
    cart.total = discounted + cart.shipping;
    this.cartSubject.next({ ...cart });
  }
}
