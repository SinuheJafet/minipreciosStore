import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

const TOKEN_KEY = 'mp_token';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      return next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
    }
    return next.handle(req);
  }
}
