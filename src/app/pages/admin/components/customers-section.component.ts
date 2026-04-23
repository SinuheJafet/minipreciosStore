import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { StoreCustomer } from '../../../models/admin.model';
import { ColumnSource } from '../../../shared/components/dynamic-table/dynamic-table.entities';
import { CustomersAdminService } from '../services/customers-admin.service';

@Component({
  selector: 'admin-customers-section',
  templateUrl: './customers-section.component.html',
  styleUrls: ['./customers-section.component.scss']
})
export class CustomersSectionComponent implements OnInit {
  customers!: Observable<StoreCustomer[]>;
  selectedCustomer: StoreCustomer | null = null;
  allCustomers: StoreCustomer[] = [];

  constructor(private svc: CustomersAdminService) {}

  columns: ColumnSource[] = [
    { columnDef: 'name', headerName: 'Cliente',
      isHtmlTemplate: true, contentTemplate: (r: StoreCustomer) =>
        `<div style="display:flex;align-items:center;gap:10px">
           <div style="width:34px;height:34px;border-radius:50%;background:#dbeafe;color:#2563eb;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">${r.name[0].toUpperCase()}</div>
           <div>
             <span style="display:block;font-weight:600;color:#0f172a;font-size:13px">${r.name}</span>
             <span style="display:block;font-size:11px;color:#94a3b8">${r.email}</span>
           </div>
         </div>` },
    { columnDef: 'phone', headerName: 'Teléfono',
      cell: (r: StoreCustomer) => r.phone ?? '—' },
    { columnDef: 'city', headerName: 'Ciudad',
      isHtmlTemplate: true, contentTemplate: (r: StoreCustomer) =>
        r.city ? `<span style="font-size:12px;color:#475569">${r.city}, ${r.country}</span>` : `<span style="color:#cbd5e1">—</span>` },
    { columnDef: 'registeredAt', headerName: 'Registro',
      cell: (r: StoreCustomer) => r.registeredAt },
    { columnDef: 'totalOrders', headerName: 'Pedidos',
      isHtmlTemplate: true, contentTemplate: (r: StoreCustomer) =>
        `<span style="font-weight:600;color:#0f172a">${r.totalOrders}</span>` },
    { columnDef: 'totalSpent', headerName: 'Total gastado',
      isHtmlTemplate: true, contentTemplate: (r: StoreCustomer) =>
        `<span style="font-weight:700;color:#7c3aed">$${r.totalSpent.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>` },
    { columnDef: 'isActive', headerName: 'Estado',
      isHtmlTemplate: true, contentTemplate: (r: StoreCustomer) =>
        r.isActive
          ? `<span style="padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;background:#d1fae5;color:#059669">Activo</span>`
          : `<span style="padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;background:#fef2f2;color:#dc2626">Inactivo</span>` },
    { columnDef: 'ops', headerName: '', operations: [
        { icon: 'visibility', toolTip: 'Ver detalle', color: 'op-view', action: (r: StoreCustomer) => this.openDetail(r) },
      ]},
  ];

  ngOnInit(): void {
    this.customers = this.svc.getCustomers();
    this.customers.subscribe(c => this.allCustomers = c);
  }

  get totalRevenue(): number { return this.allCustomers.reduce((s, c) => s + c.totalSpent, 0); }
  get activeCount(): number  { return this.allCustomers.filter(c => c.isActive).length; }
  get repeatCount(): number  { return this.allCustomers.filter(c => c.totalOrders > 1).length; }

  openDetail(c: StoreCustomer): void { this.selectedCustomer = c; }
  closeDetail(): void { this.selectedCustomer = null; }

  customerOrders(): number[] {
    if (!this.selectedCustomer) return [];
    return Array(this.selectedCustomer.totalOrders).fill(0);
  }
}
