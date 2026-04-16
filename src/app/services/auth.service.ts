import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';

const ADMIN_SEED: User & { password: string } = {
  id: 1, name: 'Administrador', email: 'admin@miniprecios.com', role: 'admin', password: 'admin123'
};
const SESSION_KEY = 'mp_session';
const USERS_KEY = 'mp_users';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.userSubject.asObservable();

  constructor() {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) this.userSubject.next(JSON.parse(stored));
  }

  get currentUser(): User | null { return this.userSubject.value; }
  get isLoggedIn(): boolean { return !!this.userSubject.value; }
  get isAdmin(): boolean { return this.userSubject.value?.role === 'admin'; }

  login(email: string, password: string): { success: boolean; message: string } {
    if (email === ADMIN_SEED.email && password === ADMIN_SEED.password) {
      const { password: _, ...admin } = ADMIN_SEED;
      this.persist(admin);
      return { success: true, message: '' };
    }
    const users: Array<User & { password: string }> = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const match = users.find(u => u.email === email && u.password === password);
    if (match) {
      const { password: _, ...user } = match;
      this.persist(user);
      return { success: true, message: '' };
    }
    return { success: false, message: 'Email o contraseña incorrectos' };
  }

  register(name: string, email: string, password: string): { success: boolean; message: string } {
    if (email === ADMIN_SEED.email) return { success: false, message: 'Email ya en uso' };
    const users: Array<User & { password: string }> = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find(u => u.email === email)) return { success: false, message: 'El email ya está registrado' };
    const newUser: User & { password: string } = { id: Date.now(), name, email, role: 'user', password };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const { password: _, ...user } = newUser;
    this.persist(user);
    return { success: true, message: '' };
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.userSubject.next(null);
  }

  private persist(user: User): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }
}
