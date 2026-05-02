import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AdminComponent } from './admin.component';
import { DashboardSectionComponent } from './components/dashboard-section.component';
import { PosSectionComponent } from './components/pos-section.component';
import { OrdersSectionComponent } from './components/orders-section.component';
import { ProductsSectionComponent } from './components/products-section.component';
import { UsersSectionComponent } from './components/users-section.component';
import { CustomersSectionComponent } from './components/customers-section.component';
import { BannersSectionComponent } from './components/banners-section.component';
import { PaymentAccountsSectionComponent } from './components/payment-accounts-section.component';
import { DynamicTableModule } from '../../shared/components/dynamic-table/dynamic-table.module';
import { ScannerInputComponent } from '../../shared/components/scanner-input/scanner-input.component';

@NgModule({
  declarations: [
    AdminComponent,
    DashboardSectionComponent,
    PosSectionComponent,
    OrdersSectionComponent,
    ProductsSectionComponent,
    UsersSectionComponent,
    CustomersSectionComponent,
    BannersSectionComponent,
    PaymentAccountsSectionComponent,
    ScannerInputComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    DynamicTableModule,
  ],
  exports: [AdminComponent],
})
export class AdminModule {}
