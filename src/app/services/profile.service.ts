import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Address, SavedCard } from '../models/user.model';
import { environment } from '../../environments/environment';

interface UpdateProfileDto {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = `${environment.apiUrl}/users/me`;

  constructor(private http: HttpClient) {}

  // ── Addresses ──────────────────────────────────────────────────────────────

  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.api}/addresses`).pipe(
      catchError(() => of([]))
    );
  }

  addAddress(address: Omit<Address, 'id'>): Observable<Address | null> {
    return this.http.post<Address>(`${this.api}/addresses`, address).pipe(
      catchError(() => of(null))
    );
  }

  updateAddress(id: number, address: Partial<Address>): Observable<Address | null> {
    return this.http.put<Address>(`${this.api}/addresses/${id}`, address).pipe(
      catchError(() => of(null))
    );
  }

  deleteAddress(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.api}/addresses/${id}`).pipe(
      catchError(() => of(false))
    );
  }

  setDefaultAddress(id: number): Observable<boolean> {
    return this.http.patch<boolean>(`${this.api}/addresses/${id}/default`, {}).pipe(
      catchError(() => of(false))
    );
  }

  // ── Payment methods ─────────────────────────────────────────────────────────

  getSavedCards(): Observable<SavedCard[]> {
    return this.http.get<SavedCard[]>(`${this.api}/payment-methods`).pipe(
      catchError(() => of([]))
    );
  }

  addCard(card: Omit<SavedCard, 'id'>): Observable<SavedCard | null> {
    return this.http.post<SavedCard>(`${this.api}/payment-methods`, card).pipe(
      catchError(() => of(null))
    );
  }

  deleteCard(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.api}/payment-methods/${id}`).pipe(
      catchError(() => of(false))
    );
  }

  setDefaultCard(id: number): Observable<boolean> {
    return this.http.patch<boolean>(`${this.api}/payment-methods/${id}/default`, {}).pipe(
      catchError(() => of(false))
    );
  }

  // ── Profile ─────────────────────────────────────────────────────────────────

  updateProfile(dto: UpdateProfileDto): Observable<{ name: string; email: string } | null> {
    return this.http.put<{ name: string; email: string }>(this.api, dto).pipe(
      catchError(() => of(null))
    );
  }
}
