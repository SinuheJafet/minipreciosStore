import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of } from 'rxjs';
import { AdminBanner } from '../../../models/admin.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BannersAdminService {
  private _data = new BehaviorSubject<AdminBanner[]>([]);
  private api = `${environment.apiUrl}/banners`;

  constructor(private http: HttpClient) {}

  getBanners(): Observable<AdminBanner[]> {
    this.load();
    return this._data.asObservable();
  }

  /** Endpoint público — usado por la tienda (home) */
  getPublicBanners(type?: string): Observable<AdminBanner[]> {
    let params = new HttpParams().set('_ts', Date.now().toString());
    if (type) {
      params = params.set('type', type);
    }

    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    return this.http.get<AdminBanner[]>(`${this.api}/active`, { params, headers }).pipe(
      catchError(() => of([] as AdminBanner[])),
      // Extra guard to avoid stale/invalid items rendered by clients.
      // Backend should enforce this too, but client-side filtering prevents ghost banners.
      map(list => this.sanitizePublicBanners(list, type))
    );
  }

  add(banner: Omit<AdminBanner, 'id'>): void {
    this.http.post<AdminBanner>(this.api, banner).pipe(catchError(() => of(null)))
      .subscribe(() => this.load());
  }

  update(id: number, patch: Partial<AdminBanner>): void {
    this.http.put<AdminBanner>(`${this.api}/${id}`, patch).pipe(catchError(() => of(null)))
      .subscribe(() => this.load());
  }

  remove(id: number): void {
    this.http.delete(`${this.api}/${id}`).pipe(catchError(() => of(null)))
      .subscribe(() => this.load());
  }

  toggleActive(id: number): void {
    this.http.patch(`${this.api}/${id}/toggle`, {}).pipe(catchError(() => of(null)))
      .subscribe(() => this.load());
  }

  private load(): void {
    this.http.get<AdminBanner[]>(this.api).pipe(catchError(() => of([] as AdminBanner[])))
      .subscribe(list => this._data.next(list));
  }

  private sanitizePublicBanners(list: AdminBanner[], type?: string): AdminBanner[] {
    const now = new Date();
    const byId = new Map<number, AdminBanner>();

    for (const banner of list) {
      if (type && banner.type !== type) {
        continue;
      }
      if (!banner.isActive) {
        continue;
      }

      const validFrom = banner.validFrom ? new Date(banner.validFrom) : null;
      const validTo = banner.validTo ? new Date(banner.validTo) : null;
      if (validFrom && validFrom > now) {
        continue;
      }
      if (validTo && validTo < now) {
        continue;
      }

      byId.set(banner.id, banner);
    }

    return Array.from(byId.values()).sort((a, b) => a.position - b.position);
  }
}
