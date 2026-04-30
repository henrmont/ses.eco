import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth-service';

export const authGuard: CanActivateChildFn = (childRoute, state) => {
  const router = inject(Router);
  const token = window.localStorage.getItem('token');
  const user = inject(AuthService).me();

  if (token) {
    return new Observable<boolean>(obs => {
      user.subscribe({
        next: (response) => {
          if (response.is_valid) {
            obs.next(true);
          } else {
            obs.next(false);
            window.localStorage.clear();
            router.navigate(['/']);
          }
        },
        error: () => {
          obs.next(false);
          window.localStorage.clear();
          router.navigate(['/']);
        }
      })
    });
  } else {
    router.navigate(['/']);
    return false;
  }
};
