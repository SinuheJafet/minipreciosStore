import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { Kit } from '../../../models/kit.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class KitsAdminService {
  private _data = new BehaviorSubject<Kit[]>([]);
  private api = `${environment.apiUrl}/kits`;

  constructor(private http: HttpClient) {}

  getKits(): Observable<Kit[]> {
    this.load();
    return this._data.asObservable();
  }

  add(dto: Omit<Kit, 'id'>): Observable<Kit | null> {
    return this.http.post<Kit>(this.api, dto).pipe(
      tap(() => this.load()),
      catchError(() => of(null))
    );
  }

  update(id: number, dto: Partial<Kit>): Observable<Kit | null> {
    return this.http.put<Kit>(`${this.api}/${id}`, dto).pipe(
      tap(() => this.load()),
      catchError(() => of(null))
    );
  }

  remove(id: number): void {
    this.http.delete(`${this.api}/${id}`).pipe(catchError(() => of(null)))
      .subscribe(() => this.load());
  }

  private load(): void {
    this.http.get<Kit[]>(this.api).pipe(catchError(() => of([])))
      .subscribe(d => this._data.next(d));
  }
}
