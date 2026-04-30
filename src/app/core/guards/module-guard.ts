import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth-service';

export const moduleGuard: CanActivateChildFn = (childRoute, state) => {
  const user = inject(AuthService).me();
  const router = inject(Router);
  const fragments = state.url.split('/');
  return new Observable<boolean>(obs => {
    user.subscribe({
      next: (response) => {
        if (response.module && fragments.includes(response.module.name)) {
          obs.next(true);
        } else {
          obs.next(false);
          router.navigate(['/principal']);
        }
      },
      error: () => {
        obs.next(false);
        router.navigate(['/principal']);
      }
    })
  });
};
