import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of } from 'rxjs';
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
    const url = type ? `${this.api}/active?type=${type}` : `${this.api}/active`;
    return this.http.get<AdminBanner[]>(url).pipe(catchError(() => of([] as AdminBanner[])));
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
}
