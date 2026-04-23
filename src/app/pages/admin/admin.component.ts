import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OrdersAdminService } from './services/orders-admin.service';
import { InventoryAdminService } from './services/inventory-admin.service';

export type AdminSection = 'dashboard' | 'pos' | 'orders' | 'products' | 'inventory' | 'movements' | 'users' | 'customers' | 'banners';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  activeSection: AdminSection = 'dashboard';
  sidebarOpen = window.innerWidth > 900;

  pendingOrdersCount = 0;
  lowStockCount = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private ordersService: OrdersAdminService,
    private inventoryService: InventoryAdminService,
  ) {}

  ngOnInit(): void {
    this.ordersService.pendingCount$.subscribe(n => this.pendingOrdersCount = n);
    this.inventoryService.lowStockCount$.subscribe(n => this.lowStockCount = n);
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
