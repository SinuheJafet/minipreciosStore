import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of } from 'rxjs';
import { AdminUser } from '../../../models/admin.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsersAdminService {
  private _data = new BehaviorSubject<AdminUser[]>([]);
  private api = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<AdminUser[]> {
    this.load();
    return this._data.asObservable();
  }

  add(user: Omit<AdminUser, 'id' | 'createdAt' | 'lastLogin'>): void {
    this.http.post<AdminUser>(this.api, user).pipe(catchError(() => of(null)))
      .subscribe(() => this.load());
  }

  update(id: number, patch: Partial<AdminUser>): void {
    this.http.put<AdminUser>(`${this.api}/${id}`, patch).pipe(catchError(() => of(null)))
      .subscribe(() => this.load());
  }

  remove(id: number): void {
    this.http.delete(`${this.api}/${id}`).pipe(catchError(() => of(null)))
      .subscribe(() => this.load());
  }

  private load(): void {
    this.http.get<AdminUser[]>(this.api).pipe(catchError(() => of([] as AdminUser[])))
      .subscribe(list => this._data.next(list));
  }
}
