import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaymentAccount } from '../models/payment-account.model';

@Injectable({ providedIn: 'root' })
export class PaymentAccountsService {
  private api = `${environment.apiUrl}/payment-accounts`;
  private storageKey = 'miniprecios.paymentAccounts';

  // Fallback while backend endpoint is not available yet.
  private fallback: PaymentAccount[] = [
    {
      id: 1,
      alias: 'Cuenta principal',
      bank: 'BBVA',
      accountName: 'Miniprecios Store SA de CV',
      clabe: '012345678901234567',
      accountNumber: '1234567890',
      instructions: 'Concepto: Pedido #{numeroPedido}',
      isDefault: true,
      isActive: true,
    },
  ];

  constructor(private http: HttpClient) {}

  getPublicAccounts(): Observable<PaymentAccount[]> {
    return this.http.get<PaymentAccount[]>(`${this.api}/public`).pipe(
      map(list => {
        this.setLocalAccounts(list);
        return (list || []).filter(a => a.isActive);
      }),
      catchError(() => of(this.getLocalAccounts().filter(a => a.isActive)))
    );
  }

  getAdminAccounts(): Observable<PaymentAccount[]> {
    return this.http.get<PaymentAccount[]>(this.api).pipe(
      map(list => {
        this.setLocalAccounts(list);
        return list;
      }),
      catchError(() => of(this.getLocalAccounts()))
    );
  }

  createAccount(dto: Omit<PaymentAccount, 'id'>): Observable<PaymentAccount | null> {
    return this.http.post<PaymentAccount>(this.api, dto).pipe(
      map(created => {
        const accounts = this.getLocalAccounts();
        const merged = [...accounts.filter(a => a.id !== created.id), created];
        this.setLocalAccounts(merged);
        return created;
      }),
      catchError(() => {
        const accounts = this.getLocalAccounts();
        const nextId = Math.max(0, ...accounts.map(a => a.id ?? 0)) + 1;

        let updated = [...accounts];
        if (dto.isDefault) {
          updated = updated.map(a => ({ ...a, isDefault: false }));
        }

        const created: PaymentAccount = { ...dto, id: nextId };
        updated.push(created);
        this.setLocalAccounts(updated);
        return of(created);
      })
    );
  }

  updateAccount(id: number, dto: Omit<PaymentAccount, 'id'>): Observable<PaymentAccount | null> {
    return this.http.put<PaymentAccount>(`${this.api}/${id}`, dto).pipe(
      map(updated => {
        const accounts = this.getLocalAccounts();
        const merged = accounts.map(a => (a.id === id ? updated : a));
        this.setLocalAccounts(merged);
        return updated;
      }),
      catchError(() => {
        const accounts = this.getLocalAccounts();
        if (!accounts.some(a => a.id === id)) return of(null);

        let updated = [...accounts];
        if (dto.isDefault) {
          updated = updated.map(a => ({ ...a, isDefault: false }));
        }

        updated = updated.map(a => (a.id === id ? { ...dto, id } : a));
        this.setLocalAccounts(updated);
        return of(updated.find(a => a.id === id) ?? null);
      })
    );
  }

  deleteAccount(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.api}/${id}`).pipe(
      map(ok => {
        if (ok) {
          const updated = this.getLocalAccounts().filter(a => a.id !== id);
          this.setLocalAccounts(updated);
        }
        return ok;
      }),
      catchError(() => {
        const updated = this.getLocalAccounts().filter(a => a.id !== id);
        this.setLocalAccounts(updated);
        return of(true);
      })
    );
  }

  setDefault(id: number): Observable<boolean> {
    return this.http.patch<boolean>(`${this.api}/${id}/default`, {}).pipe(
      map(ok => {
        if (ok) {
          const updated = this.getLocalAccounts().map(a => ({ ...a, isDefault: a.id === id }));
          this.setLocalAccounts(updated);
        }
        return ok;
      }),
      catchError(() => {
        const accounts = this.getLocalAccounts();
        if (!accounts.some(a => a.id === id)) return of(false);

        const updated = accounts.map(a => ({ ...a, isDefault: a.id === id }));
        this.setLocalAccounts(updated);
        return of(true);
      })
    );
  }

  private getLocalAccounts(): PaymentAccount[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      this.setLocalAccounts(this.fallback);
      return [...this.fallback];
    }

    try {
      const parsed = JSON.parse(raw) as PaymentAccount[];
      if (!Array.isArray(parsed)) {
        this.setLocalAccounts(this.fallback);
        return [...this.fallback];
      }
      return this.normalizeAccounts(parsed);
    } catch {
      this.setLocalAccounts(this.fallback);
      return [...this.fallback];
    }
  }

  private setLocalAccounts(accounts: PaymentAccount[] | null | undefined): void {
    const normalized = this.normalizeAccounts(accounts ?? []);
    localStorage.setItem(this.storageKey, JSON.stringify(normalized));
  }

  private normalizeAccounts(accounts: PaymentAccount[]): PaymentAccount[] {
    if (!accounts.length) return [];

    const cloned = accounts.map((a, i) => ({ ...a, id: a.id ?? (i + 1) }));
    const hasDefault = cloned.some(a => a.isDefault && a.isActive);

    if (!hasDefault) {
      const firstActive = cloned.find(a => a.isActive);
      if (firstActive) {
        firstActive.isDefault = true;
      }
    }

    return cloned;
  }
}
