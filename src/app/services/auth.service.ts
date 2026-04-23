import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

const TOKEN_KEY   = 'mp_token';
const SESSION_KEY = 'mp_session';

interface AuthResponse { token: string; user: User; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) this.userSubject.next(JSON.parse(stored));
  }

  get currentUser(): User | null  { return this.userSubject.value; }
  get isLoggedIn(): boolean        { return !!this.userSubject.value; }
  get isAdmin(): boolean           { return this.userSubject.value?.role === 'admin'; }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => this.persist(res.token, res.user)),
      catchError(err => throwError(() => new Error(
        err.status === 401 ? 'Email o contraseña incorrectos' : 'Error al iniciar sesión'
      )))
    );
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, { name, email, password }).pipe(
      tap(res => this.persist(res.token, res.user)),
      catchError(err => throwError(() => new Error(
        err.status === 409 ? 'El email ya está registrado' : 'Error al registrarse'
      )))
    );
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    this.userSubject.next(null);
  }

  private persist(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }
}
