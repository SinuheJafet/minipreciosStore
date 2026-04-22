import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminUser } from '../../../models/admin.model';
import { ColumnSource } from '../../../shared/components/dynamic-table/dynamic-table.entities';

@Component({
  selector: 'admin-users-section',
  templateUrl: './users-section.component.html',
  styleUrls: ['./users-section.component.scss']
})
export class UsersSectionComponent {
  @Input() users!: Observable<AdminUser[]>;

  readonly roleColors: Record<string, [string,string]> = {
    admin:   ['#ede9fe','#7c3aed'],
    manager: ['#dbeafe','#2563eb'],
    cashier: ['#d1fae5','#059669'],
    viewer:  ['#f1f5f9','#64748b'],
  };
  readonly roleLabels: Record<string, string> = {
    admin: 'Administrador', manager: 'Gerente', cashier: 'Cajero', viewer: 'Solo lectura',
  };

  columns: ColumnSource[] = [
    { columnDef: 'name', headerName: 'Usuario',
      isHtmlTemplate: true, contentTemplate: (r: AdminUser) =>
        `<div style="display:flex;align-items:center;gap:10px">
          <div style="width:34px;height:34px;border-radius:50%;background:#ede9fe;color:#7c3aed;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">${r.name[0].toUpperCase()}</div>
          <div><span style="display:block;font-weight:600;color:#0f172a;font-size:13px">${r.name}</span><span style="display:block;font-size:11px;color:#94a3b8">${r.email}</span></div>
        </div>` },
    { columnDef: 'role', headerName: 'Rol',
      isHtmlTemplate: true, contentTemplate: (r: AdminUser) => {
        const [bg, c] = this.roleColors[r.role] ?? ['#f1f5f9','#64748b'];
        return `<span style="padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;background:${bg};color:${c}">${this.roleLabels[r.role] ?? r.role}</span>`;
      }},
    { columnDef: 'isActive', headerName: 'Estado',
      isHtmlTemplate: true, contentTemplate: (r: AdminUser) =>
        r.isActive
          ? `<span style="padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;background:#d1fae5;color:#059669">Activo</span>`
          : `<span style="padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;background:#fef2f2;color:#dc2626">Inactivo</span>` },
    { columnDef: 'createdAt',  headerName: 'Alta',      cell: (r: AdminUser) => r.createdAt },
    { columnDef: 'lastLogin',  headerName: 'Último acceso', cell: (r: AdminUser) => r.lastLogin ?? '—' },
    { columnDef: 'ops', headerName: '', operations: [
        { icon: 'edit',   toolTip: 'Editar',    color: 'op-edit',   action: (r: AdminUser) => {} },
        { icon: 'delete', toolTip: 'Eliminar',  color: 'op-delete', action: (r: AdminUser) => {} },
      ]},
  ];

  addUser(): void { /* open modal */ }
}
