import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of } from 'rxjs';
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

  private load(): void {
    this.http.get<StoreCustomer[]>(this.api).pipe(catchError(() => of([] as StoreCustomer[])))
      .subscribe(list => this._data.next(list));
  }
}
