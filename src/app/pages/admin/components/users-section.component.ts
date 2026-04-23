import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminUser } from '../../../models/admin.model';
import { ColumnSource } from '../../../shared/components/dynamic-table/dynamic-table.entities';
import { UsersAdminService } from '../services/users-admin.service';

interface UserForm {
  id: number | null;
  name: string;
  email: string;
  password: string;
  role: AdminUser['role'];
  isActive: boolean;
}

const EMPTY_FORM = (): UserForm => ({
  id: null, name: '', email: '', password: '', role: 'cashier', isActive: true,
});

@Component({
  selector: 'admin-users-section',
  templateUrl: './users-section.component.html',
  styleUrls: ['./users-section.component.scss']
})
export class UsersSectionComponent implements OnInit {
  users!: Observable<AdminUser[]>;
  constructor(private svc: UsersAdminService) {}
  ngOnInit(): void { this.users = this.svc.getUsers(); }

  showModal = false;
  isEdit = false;
  form: UserForm = EMPTY_FORM();
  showDeleteConfirm = false;
  deletingUser: AdminUser | null = null;
  showPassword = false;

  readonly roles: { value: AdminUser['role']; label: string; desc: string }[] = [
    { value: 'admin',   label: 'Administrador', desc: 'Acceso total al sistema' },
    { value: 'manager', label: 'Gerente',        desc: 'Gestión de pedidos, productos e inventario' },
    { value: 'cashier', label: 'Cajero',         desc: 'POS y movimientos de inventario' },
    { value: 'viewer',  label: 'Solo lectura',   desc: 'Solo puede consultar información' },
  ];

  readonly roleColors: Record<string, [string, string]> = {
    admin:   ['#ede9fe', '#7c3aed'],
    manager: ['#dbeafe', '#2563eb'],
    cashier: ['#d1fae5', '#059669'],
    viewer:  ['#f1f5f9', '#64748b'],
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
        const [bg, c] = this.roleColors[r.role] ?? ['#f1f5f9', '#64748b'];
        return `<span style="padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;background:${bg};color:${c}">${this.roleLabels[r.role] ?? r.role}</span>`;
      }},
    { columnDef: 'isActive', headerName: 'Estado',
      isHtmlTemplate: true, contentTemplate: (r: AdminUser) =>
        r.isActive
          ? `<span style="padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;background:#d1fae5;color:#059669">Activo</span>`
          : `<span style="padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;background:#fef2f2;color:#dc2626">Inactivo</span>` },
    { columnDef: 'createdAt', headerName: 'Alta',           cell: (r: AdminUser) => r.createdAt },
    { columnDef: 'lastLogin', headerName: 'Último acceso',  cell: (r: AdminUser) => r.lastLogin ?? '—' },
    { columnDef: 'ops', headerName: '', operations: [
        { icon: 'edit',   toolTip: 'Editar',   color: 'op-edit',   action: (r: AdminUser) => this.openEdit(r) },
        { icon: 'delete', toolTip: 'Eliminar', color: 'op-delete', action: (r: AdminUser) => this.confirmDelete(r) },
      ]},
  ];

  openCreate(): void { this.form = EMPTY_FORM(); this.isEdit = false; this.showPassword = false; this.showModal = true; }

  openEdit(u: AdminUser): void {
    this.form = { id: u.id, name: u.name, email: u.email, password: '', role: u.role, isActive: u.isActive };
    this.isEdit = true;
    this.showPassword = false;
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  get isFormValid(): boolean {
    return !!(this.form.name && this.form.email && (this.isEdit || this.form.password));
  }

  saveUser(): void {
    if (!this.isFormValid) return;
    if (this.isEdit && this.form.id) {
      this.svc.update(this.form.id, { name: this.form.name, email: this.form.email,
        role: this.form.role, isActive: this.form.isActive });
    } else {
      this.svc.add({ name: this.form.name, email: this.form.email,
        role: this.form.role, isActive: this.form.isActive });
    }
    this.closeModal();
  }

  confirmDelete(u: AdminUser): void { this.deletingUser = u; this.showDeleteConfirm = true; }
  cancelDelete(): void { this.deletingUser = null; this.showDeleteConfirm = false; }
  doDelete(): void { if (this.deletingUser) this.svc.remove(this.deletingUser.id); this.cancelDelete(); }
}
