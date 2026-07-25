import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);
  const token = auth.token;

  const cloned = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(cloned).pipe(
    catchError((err) => {
      const message = err?.error?.message || 'Something went wrong. Please try again.';
      const isAuthRoute = req.url.includes('/login') || req.url.includes('/register');

      if (err.status === 401) {
        if (!isAuthRoute && auth.token) {
          toast.error('Session expired. Please log in again.');
          auth.logout();
        }
      } else if (err.status === 403 && message.toLowerCase().includes('blocked')) {
        toast.error(message);
        auth.logout();
      } else if (!isAuthRoute) {
        toast.error(message);
      }
      return throwError(() => err);
    })
  );
};
