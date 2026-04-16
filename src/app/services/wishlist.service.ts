import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private itemsSubject = new BehaviorSubject<Product[]>([]);
  items$ = this.itemsSubject.asObservable();

  toggle(product: Product): void {
    const items = this.itemsSubject.value;
    const idx = items.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      items.splice(idx, 1);
    } else {
      items.push(product);
    }
    this.itemsSubject.next([...items]);
  }

  isWishlisted(productId: number): boolean {
    return this.itemsSubject.value.some(p => p.id === productId);
  }

  get count(): number {
    return this.itemsSubject.value.length;
  }
}
