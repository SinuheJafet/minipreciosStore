import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { WishlistService } from '../../../services/wishlist.service';
import { ProductService } from '../../../services/product.service';
import { AuthService } from '../../../services/auth.service';
import { Product } from '../../../models/product.model';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  cartCount = 0;
  wishlistCount = 0;
  searchQuery = '';
  searchResults: Product[] = [];
  showSearch = false;
  isScrolled = false;
  mobileMenuOpen = false;
  userDropdown = false;
  currentUser: User | null = null;

  navLinks = [
    { label: 'Inicio', path: '/' },
    { label: 'Productos', path: '/products' },
    { label: 'Ofertas', path: '/products', queryParams: { filter: 'sale' } },
    { label: 'Nuevos', path: '/products', queryParams: { filter: 'new' } },
  ];

  constructor(
    private cartService: CartService,
    private wishlistService: WishlistService,
    private productService: ProductService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartService.cart$.subscribe(cart => {
      this.cartCount = cart.items.reduce((s, i) => s + i.quantity, 0);
    });
    this.wishlistService.items$.subscribe(items => {
      this.wishlistCount = items.length;
    });
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.userDropdown = false;
    }
  }

  onSearch(query: string): void {
    if (query.length > 1) {
      this.productService.searchProducts(query).subscribe(results => {
        this.searchResults = results.slice(0, 5);
      });
    } else {
      this.searchResults = [];
    }
  }

  goToProduct(id: number): void {
    this.searchResults = [];
    this.searchQuery = '';
    this.showSearch = false;
    this.router.navigate(['/products', id]);
  }

  submitSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { queryParams: { q: this.searchQuery } });
      this.searchResults = [];
      this.showSearch = false;
    }
  }

  logout(): void {
    this.authService.logout();
    this.userDropdown = false;
    this.router.navigate(['/']);
  }

  get firstName(): string {
    return this.currentUser?.name.split(' ')[0] ?? '';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }
}
