import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService)
  const accessToken = window.localStorage.getItem('token')
  let authreq = req.clone({
    setHeaders: {
        Authorization: `Bearer ${accessToken}`
    }
  })
  return next(authreq).pipe(
    catchError((error) => {
        if([401,403].includes(error.status) && window.localStorage.getItem('token')) {
          return authService.refresh().pipe(
            switchMap(
              (response: any) => {
                window.localStorage.setItem('token', response.access_token)
                if (window.localStorage.getItem('token')) {
                  authreq = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${window.localStorage.getItem('token')}`
                    }
                  });
                }
                return next(authreq)
              }
            ),
            catchError(
              (error) => {
                return throwError(() => error)
              }
            )
          )
        }
        return throwError(() => error)
      }
    )
  );
};
