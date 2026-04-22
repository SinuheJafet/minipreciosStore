import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProductsAdminService } from './services/products-admin.service';
import { OrdersAdminService } from './services/orders-admin.service';
import { InventoryAdminService } from './services/inventory-admin.service';
import { UsersAdminService } from './services/users-admin.service';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../../models/product.model';
import { AdminOrder, InventoryMovement, AdminUser, AdminStats } from '../../models/admin.model';

export type AdminSection = 'dashboard' | 'pos' | 'orders' | 'products' | 'inventory' | 'movements' | 'users';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  activeSection: AdminSection = 'dashboard';
  sidebarOpen = window.innerWidth > 900;

  products$!: Observable<Product[]>;
  orders$!: Observable<AdminOrder[]>;
  inventory$!: Observable<Product[]>;
  movements$!: Observable<InventoryMovement[]>;
  users$!: Observable<AdminUser[]>;
  stats$!: Observable<AdminStats>;

  pendingOrdersCount = 0;
  lowStockCount = 0;

  readonly navItems: { section: AdminSection; label: string; icon: string; badgeKey?: keyof AdminComponent }[] = [
    { section: 'dashboard',  label: 'Dashboard',   icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
    { section: 'pos',        label: 'Nueva venta',  icon: 'M4 4h16v2H4zm0 4h16v2H4zm0 4h10v2H4zm12 4v-4l4 4-4 4v-4h-2v-4h2z' },
    { section: 'orders',     label: 'Pedidos',      icon: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0' },
    { section: 'products',   label: 'Productos',    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { section: 'inventory',  label: 'Inventario',   icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0-1-1h4a2 2 0 0 0-1 1' },
    { section: 'movements',  label: 'Movimientos',  icon: 'M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4' },
    { section: 'users',      label: 'Usuarios',     icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private productsService: ProductsAdminService,
    private ordersService: OrdersAdminService,
    private inventoryService: InventoryAdminService,
    private usersService: UsersAdminService,
  ) {}

  ngOnInit(): void {
    this.products$  = this.productsService.getProducts();
    this.orders$    = this.ordersService.getOrders();
    this.inventory$ = this.inventoryService.getInventory();
    this.movements$ = this.inventoryService.getMovements();
    this.users$     = this.usersService.getUsers();

    this.stats$ = combineLatest([this.orders$, this.inventory$, this.users$]).pipe(
      map(([orders, inv, users]) => ({
        totalRevenue:        orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
        totalOrders:         orders.length,
        pendingOrders:       orders.filter(o => o.status === 'pending').length,
        totalProducts:       inv.length,
        lowStockProducts:    inv.filter(p => p.stock > 0 && p.stock <= 5).length,
        outOfStockProducts:  inv.filter(p => p.stock === 0).length,
        totalUsers:          users.length,
        revenueToday:        orders.filter(o => o.createdAt === '2026-04-22' && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
        ordersToday:         orders.filter(o => o.createdAt === '2026-04-22').length,
      }))
    );

    this.orders$.subscribe(list => this.pendingOrdersCount = list.filter(o => o.status === 'pending').length);
    this.inventory$.subscribe(list => this.lowStockCount = list.filter(p => p.stock <= 5).length);
  }

  navigate(section: AdminSection): void {
    this.activeSection = section;
    if (window.innerWidth <= 900) this.sidebarOpen = false;
  }

  @HostListener('window:resize', ['$event'])
  onResize(e: Event): void { this.sidebarOpen = (e.target as Window).innerWidth > 900; }

  logout(): void { this.authService.logout(); this.router.navigate(['/']); }
  get adminName(): string { return this.authService.currentUser?.name || 'Admin'; }
}
