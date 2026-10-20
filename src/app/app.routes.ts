import { Routes } from '@angular/router';
import { IndexLayout } from './core/layouts/index-layout/index.layout';
import { loggedGuard } from './core/guards/logged-guard';
import { CoreLayout } from './core/layouts/core-layout/core.layout';
import { authResolver } from './core/resolvers/auth-resolver';
import { authGuard } from './core/guards/auth-guard';
import { TfdLayout } from './tfd/layout/tfd.layout';
import { AvaliableModules } from './core/enums/avaliable-modules';
import { DatasusLayout } from './datasus/layout/datasus.layout';
import { SislicLayout } from './sislic/layout/sislic.layout';
import { tfdGuard } from './tfd/guards/tfd.guard';
import { datasusGuard } from './datasus/guards/datasus.guard';
import { sislicGuard } from './sislic/guards/sislic.guard';

// app.routes.ts
export const routes: Routes = [
    {
        path: '',
        component: IndexLayout,
        canActivateChild: [loggedGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./core/pages/login-page/login.page').then( m => m.LoginPage)
            },
            {
                path: 'recuperar-senha',
                loadComponent: () => import('./core/pages/forgot-password-page/forgot-password.page').then( m => m.ForgotPasswordPage)
            },
            {
                path: 'resetar-senha/:token',
                loadComponent: () => import('./core/pages/reset-password-page/reset-password.page').then( m => m.ResetPasswordPage)
            },
        ]
    },
    {
        path: 'principal',
        component: CoreLayout,
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
            
            // ==========================================
            // MÓDULO TFD (Estruturado em 2 níveis)
            // ==========================================
            {
                path: 'tfd',
                component: TfdLayout,
                data: { module: 'tfd' },
                canActivate: [tfdGuard],
                canActivateChild: [authGuard.checkAccess()],
                loadChildren: () => import('./tfd/routes/tfd.routes').then(m => m.tfdRoutes)
            },

            // ==========================================
            // MÓDULO DATASUS (Estruturado em 2 níveis)
            // ==========================================
            {
                path: 'datasus',
                component: DatasusLayout,
                data: { module: 'datasus' },
                canActivate: [datasusGuard],
                canActivateChild: [authGuard.checkAccess()],
                loadChildren: () => import('./datasus/routes/datasus.routes').then(m => m.datasusRoutes)
            },

            // ==========================================
            // MÓDULO SISLIC (Estruturado em 2 níveis)
            // ==========================================
            {
                path: 'sislic',
                component: SislicLayout,
                data: { module: 'sislic' },
                canActivate: [sislicGuard],
                canActivateChild: [authGuard.checkAccess()],
                loadChildren: () => import('./sislic/routes/sislic.routes').then(m => m.sislicRoutes)
            },
            {
                path: '**',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'principal',
        pathMatch: 'full'
    }
];