import { Routes } from '@angular/router';
import { IndexLayout } from './core/layouts/index-layout/index-layout';
import { loggedGuard } from './core/guards/logged-guard';
import { CoreLayout } from './core/layouts/core-layout/core-layout';
import { authResolver } from './core/resolvers/auth-resolver';
import { authGuard } from './core/guards/auth-guard';
import { TfdLayout } from './tfd/layouts/tfd-layout/tfd-layout';
import { HomecareLayout } from './homecare/layouts/homecare-layout/homecare-layout';
import { TransplanteLayout } from './transplante/layouts/transplante-layout/transplante-layout';
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
            {
                path: 'homecare',
                component: HomecareLayout,
                canActivateChild: [authGuard.checkAccess()],
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./homecare/pages/index-page/index-page').then( m => m.IndexPage)
                    },
                    {
                        path: 'usuarios',
                        loadComponent: () => import('./homecare/pages/users-page/users-page').then( m => m.UsersPage)
                    },
                    {
                        path: 'regras',
                        loadComponent: () => import('./homecare/pages/roles-page/roles-page').then( m => m.RolesPage)
                    },
                    {
                        path: 'pacientes',
                        loadComponent: () => import('./homecare/pages/patients-page/patients-page').then( m => m.PatientsPage)
                    },
                ]
            },
            {
                path: 'transplante',
                component: TransplanteLayout,
                canActivateChild: [authGuard.checkAccess()],
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./transplante/pages/index-page/index-page').then( m => m.IndexPage)
                    },
                    {
                        path: 'usuarios',
                        loadComponent: () => import('./transplante/pages/users-page/users-page').then( m => m.UsersPage)
                    },
                    {
                        path: 'regras',
                        loadComponent: () => import('./transplante/pages/roles-page/roles-page').then( m => m.RolesPage)
                    },
                    {
                        path: 'pacientes',
                        loadComponent: () => import('./transplante/pages/patients-page/patients-page').then( m => m.PatientsPage)
                    },
                ]
            }
        ]
    }
];
