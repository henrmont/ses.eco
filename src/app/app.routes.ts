import { Routes } from '@angular/router';
import { IndexLayout } from './core/layouts/index-layout/index-layout';
import { loggedGuard } from './core/guards/logged-guard';

export const routes: Routes = [
    {
        path: '',
        component: IndexLayout,
        canActivateChild: [loggedGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./core/pages/login-page/login-page').then( m => m.LoginPage)
            },
        ]
    },
];
