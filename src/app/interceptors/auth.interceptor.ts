import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const TOKEN_KEY = 'mp_token';
// Rutas que pueden devolver 401 sin significar sesión expirada
const AUTH_PATHS = ['/auth/login', '/auth/register'];

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem(TOKEN_KEY);
    const authed = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

    return next.handle(authed).pipe(
      catchError((err: HttpErrorResponse) => {
        const isAuthEndpoint = AUTH_PATHS.some(p => req.url.includes(p));
        if (err.status === 401 && !isAuthEndpoint && token) {
          // Token expirado o inválido — cerrar sesión y redirigir
          this.auth.logout();
          this.router.navigate(['/auth'], { queryParams: { expired: '1' } });
        }
        return throwError(() => err);
      })
    );
  }
}
