import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Cart, CartItem } from '../models/cart.model';
import { Product } from '../models/product.model';
import { RealtimeService } from './realtime.service';
import { Subscription, catchError, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

interface ServerCartItemDto {
  product: Product;
  quantity: number;
}

interface SaveCartItemDto {
  productId: number;
  quantity: number;
}

interface ServerCartDto {
  items: ServerCartItemDto[];
  couponCode?: string;
  discount?: number;
}

interface SaveCartDto {
  items: SaveCartItemDto[];
  couponCode?: string;
}

@Injectable({ providedIn: 'root' })
export class CartService implements OnDestroy {
  private readonly STORAGE_KEY = 'mp_cart';
  private readonly API = `${environment.apiUrl}/cart`;
  private readonly SHIPPING_THRESHOLD = 50;
  private readonly SHIPPING_COST = 9.99;
  private readonly COUPONS: Record<string, number> = {
    'MINI10': 10, 'SAVE20': 20, 'FLASH30': 30
  };

  private cartSubject = new BehaviorSubject<Cart>(this.emptyCart());
  cart$ = this.cartSubject.asObservable();
  private subs = new Subscription();
  private loggedIn = false;
  private hydrating = false;

  constructor(
    private rt: RealtimeService,
    private authService: AuthService,
    private http: HttpClient,
  ) {
    this.restoreCart();

    this.subs.add(
      this.authService.currentUser$.subscribe(user => {
        this.loggedIn = !!user;
        if (this.loggedIn) {
          this.syncFromServer();
        } else {
          this.restoreCart();
        }
      })
    );

    this.subs.add(
      this.rt.on<Partial<Product> & { id: number }>('ProductUpdated').subscribe(updated => {
        const cart = this.cartSubject.value;
        if (!cart.items.length) return;
        if (!cart.items.some(i => i.product.id === updated.id)) return;

        // Fetch full product to guarantee latest price (SignalR payload can be partial)
        this.http.get<Product>(`${environment.apiUrl}/products/${updated.id}`).pipe(
          catchError(() => of(null))
        ).subscribe(full => {
          if (!full) return;
          const current = this.cartSubject.value;
          let changed = false;
          current.items = current.items.map(i => {
            if (i.product.id !== full.id) return i;
            changed = true;
            const quantity = Math.min(i.quantity, full.stock);
            return { ...i, product: full, quantity };
          }).filter(i => i.quantity > 0);
          if (changed) this.recalculate(current);
        });
      })
    );

    this.subs.add(
      this.rt.on<{ productId: number; stock: number }>('InventoryChanged').subscribe(({ productId, stock }) => {
        const cart = this.cartSubject.value;
        if (!cart.items.length) return;

        let changed = false;
        cart.items = cart.items.map(i => {
          if (i.product.id !== productId) return i;
          changed = true;
          const quantity = Math.min(i.quantity, stock);
          return { ...i, product: { ...i.product, stock }, quantity };
        }).filter(i => i.quantity > 0);

        if (changed) this.recalculate(cart);
      })
    );

    this.subs.add(
      this.rt.on<{ id: number }>('ProductDeleted').subscribe(({ id }) => {
        const cart = this.cartSubject.value;
        if (!cart.items.length) return;
        const next = cart.items.filter(i => i.product.id !== id);
        if (next.length === cart.items.length) return;
        cart.items = next;
        this.recalculate(cart);
      })
    );
  }

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
    const empty = this.emptyCart();
    this.cartSubject.next(empty);
    if (this.loggedIn) {
      this.clearServerCart();
      this.persistCart(empty);
    } else {
      this.persistCart(empty);
    }
  }

  get itemCount(): number {
    return this.cartSubject.value.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private recalculate(cart: Cart): void {
    cart.subtotal = cart.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const discountAmount = cart.subtotal * (cart.discount / 100);
    const discounted = cart.subtotal - discountAmount;
    cart.shipping = discounted > this.SHIPPING_THRESHOLD ? 0 : this.SHIPPING_COST;
    cart.total = discounted + cart.shipping;
    const snapshot = { ...cart };
    this.cartSubject.next(snapshot);
    if (this.hydrating) return;

    if (this.loggedIn) {
      this.persistServerCart(snapshot);
      // Keep local snapshot as fallback cache.
      this.persistCart(snapshot);
    } else {
      this.persistCart(snapshot);
    }
  }

  private restoreCart(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Cart;
      const cart = this.sanitizeCart(parsed);
      this.cartSubject.next(cart);
    } catch {
      this.cartSubject.next(this.emptyCart());
    }
  }

  private syncFromServer(): void {
    const localCart = this.sanitizeCart(this.cartSubject.value);
    this.http.get<ServerCartDto>(this.API).pipe(
      catchError(() => of<ServerCartDto>({ items: [] }))
    ).subscribe(server => {
      const serverCart = this.sanitizeCart(this.fromServerDto(server));
      const merged = this.mergeCarts(serverCart, localCart);

      this.hydrating = true;
      this.cartSubject.next(merged);
      this.hydrating = false;

      this.persistServerCart(merged);
      this.persistCart(merged);
    });
  }

  private persistServerCart(cart: Cart): void {
    const body: SaveCartDto = {
      items: cart.items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
      couponCode: cart.couponCode,
    };
    this.http.put(this.API, body).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  private clearServerCart(): void {
    this.http.delete(this.API).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  private fromServerDto(dto: ServerCartDto | null | undefined): Cart {
    return {
      items: (dto?.items ?? []).map(i => ({ product: i.product, quantity: i.quantity })),
      subtotal: 0,
      discount: dto?.discount ?? 0,
      shipping: 0,
      total: 0,
      couponCode: dto?.couponCode,
    };
  }

  private mergeCarts(serverCart: Cart, localCart: Cart): Cart {
    const map = new Map<number, CartItem>();

    for (const item of serverCart.items) {
      map.set(item.product.id, { ...item });
    }

    for (const item of localCart.items) {
      const prev = map.get(item.product.id);
      if (!prev) {
        map.set(item.product.id, { ...item });
        continue;
      }

      const maxStock = Math.max(prev.product.stock, item.product.stock);
      const qty = Math.min(prev.quantity + item.quantity, maxStock);
      map.set(item.product.id, {
        product: { ...prev.product, ...item.product, stock: maxStock },
        quantity: qty,
      });
    }

    const merged: Cart = {
      items: Array.from(map.values()).filter(i => i.product.stock > 0),
      subtotal: 0,
      discount: localCart.discount || serverCart.discount,
      shipping: 0,
      total: 0,
      couponCode: localCart.couponCode || serverCart.couponCode,
    };

    return this.sanitizeCart(merged);
  }

  private persistCart(cart: Cart): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore quota/storage errors; cart remains in memory.
    }
  }

  private sanitizeCart(cart: Cart | null | undefined): Cart {
    if (!cart || !Array.isArray(cart.items)) {
      return this.emptyCart();
    }

    const safeItems: CartItem[] = cart.items
      .filter(i => !!i && !!i.product && typeof i.product.id === 'number')
      .map(i => {
        const maxStock = typeof i.product.stock === 'number' ? i.product.stock : 0;
        return {
          product: i.product,
          quantity: Math.max(1, Math.min(i.quantity || 1, maxStock > 0 ? maxStock : 1)),
        };
      })
      .filter(i => i.product.stock > 0);

    const safeCart: Cart = {
      items: safeItems,
      subtotal: 0,
      discount: cart.discount ?? 0,
      shipping: 0,
      total: 0,
      couponCode: cart.couponCode,
    };

    const validCoupon = safeCart.couponCode && this.COUPONS[safeCart.couponCode];
    if (!validCoupon) {
      delete safeCart.couponCode;
      safeCart.discount = 0;
    }

    safeCart.subtotal = safeCart.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const discountAmount = safeCart.subtotal * (safeCart.discount / 100);
    const discounted = safeCart.subtotal - discountAmount;
    safeCart.shipping = discounted > this.SHIPPING_THRESHOLD ? 0 : this.SHIPPING_COST;
    safeCart.total = discounted + safeCart.shipping;

    return safeCart;
  }
}
