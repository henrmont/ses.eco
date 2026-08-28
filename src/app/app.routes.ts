import { Routes } from '@angular/router';
import { IndexLayout } from './core/layouts/index-layout/index-layout';
import { loggedGuard } from './core/guards/logged-guard';
import { CoreLayout } from './core/layouts/core-layout/core-layout';
import { authResolver } from './core/resolvers/auth-resolver';
import { authGuard } from './core/guards/auth-guard';
import { TfdLayout } from './tfd/layouts/tfd-layout/tfd.layout';
import { AvaliableModules } from './core/enums/avaliable-modules';

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
    {
        path: 'principal',
        component: CoreLayout,
        resolve: {user: authResolver},
        canActivateChild: [authGuard.checkModule(Object.values(AvaliableModules) as AvaliableModules[])],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./core/pages/dashboard-page/dashboard-page').then( m => m.DashboardPage)
            },
            {
                path: 'tfd',
                component: TfdLayout,
                canActivateChild: [authGuard.checkAccess()],
                loadChildren: () => import('./tfd/routes/tfd.routes').then(m => m.tfdRoutes)
            },
        ]
    }
];
