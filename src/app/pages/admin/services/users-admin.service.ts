import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AdminUser } from '../../../models/admin.model';

@Injectable({ providedIn: 'root' })
export class UsersAdminService {
  getUsers(): Observable<AdminUser[]> {
    return of([
      { id: 1, name: 'Carlos Ruiz', email: 'carlos@miniprecios.com', role: 'admin',   isActive: true,  createdAt: '2026-01-10', lastLogin: '2026-04-22' },
      { id: 2, name: 'María López', email: 'maria@miniprecios.com',  role: 'manager', isActive: true,  createdAt: '2026-02-01', lastLogin: '2026-04-21' },
      { id: 3, name: 'Pedro Gómez', email: 'pedro@miniprecios.com',  role: 'cashier', isActive: true,  createdAt: '2026-02-15', lastLogin: '2026-04-20' },
      { id: 4, name: 'Ana Torres',  email: 'ana@miniprecios.com',    role: 'viewer',  isActive: false, createdAt: '2026-03-01', lastLogin: '2026-04-01' },
    ]);
  }
}
