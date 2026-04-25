import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, switchMap } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { StoreCustomer } from '../../../models/admin.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CustomersAdminService {
  private _data = new BehaviorSubject<StoreCustomer[]>([]);
  private api = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  getCustomers(): Observable<StoreCustomer[]> {
    this.load();
    return this._data.asObservable();
  }

  add(customer: {
    name: string; email: string; password: string;
    phone?: string; city?: string; state?: string; country?: string;
    address?: string; zipCode?: string;
  }): Observable<{ success: boolean; error?: string }> {
    // Los clientes son usuarios con role="user" — se crean por el mismo endpoint de registro
    const registerUrl = `${environment.apiUrl}/auth/register`;
    return this.http.post<{ token: string; user: { id: number } }>(registerUrl, {
      name:     customer.name,
      email:    customer.email,
      password: customer.password,
    }).pipe(
      switchMap(res => {
        // Si el admin incluyó dirección, guardarla usando el token del NUEVO usuario
        // (no el del admin — el endpoint /profile/addresses usa el JWT para identificar al owner)
        if ((customer.address || customer.city) && res.token) {
          const addressUrl = `${environment.apiUrl}/profile/addresses`;
          return this.http.post(addressUrl, {
            fullName:  customer.name,
            phone:     customer.phone   ?? '',
            address:   customer.address ?? '',
            city:      customer.city    ?? '',
            state:     customer.state   ?? '',
            zipCode:   customer.zipCode ?? '',
            country:   customer.country ?? 'México',
            isDefault: true,
          }, {
            headers: { Authorization: `Bearer ${res.token}` },
          }).pipe(
            map(() => ({ success: true })),
            catchError(() => of({ success: true }))  // dirección opcional — no bloquear si falla
          );
        }
        return of({ success: true });
      }),
      tap(() => this.load()),
      catchError(err => {
        const msg = err?.error?.message ?? (err?.status === 409 ? 'El email ya está registrado' : 'Error al crear el cliente');
        return of({ success: false, error: msg });
      })
    );
  }

  update(id: number, patch: Partial<StoreCustomer>): void {
    this.http.patch<StoreCustomer>(`${this.api}/${id}`, patch).pipe(catchError(() => of(null)))
      .subscribe(() => this.load());
  }

  toggleActive(id: number, isActive: boolean): void {
    this.update(id, { isActive });
  }

  remove(id: number): void {
    this.http.delete(`${this.api}/${id}`).pipe(catchError(() => of(null)))
      .subscribe(() => this.load());
  }

  private load(): void {
    this.http.get<StoreCustomer[]>(this.api).pipe(catchError(() => of([] as StoreCustomer[])))
      .subscribe(list => this._data.next(list));
  }
}
