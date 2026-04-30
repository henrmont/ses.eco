import { Routes } from '@angular/router';
import { IndexLayout } from './core/layouts/index-layout/index-layout';
import { loggedGuard } from './core/guards/logged-guard';
import { CoreLayout } from './core/layouts/core-layout/core-layout';
import { authResolver } from './core/resolvers/auth-resolver';
import { authGuard } from './core/guards/auth-guard';
import { TfdLayout } from './tfd/layouts/tfd-layout/tfd-layout';
import { moduleGuard } from './core/guards/module-guard';
import { HomecareLayout } from './homecare/layouts/homecare-layout/homecare-layout';

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
        canActivateChild: [authGuard],
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
                canActivateChild: [moduleGuard],
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./tfd/pages/index-page/index-page').then( m => m.IndexPage)
                    },
                    {
                        path: 'usuarios',
                        loadComponent: () => import('./tfd/pages/users-page/users-page').then( m => m.UsersPage)
                    },
                    {
                        path: 'regras',
                        loadComponent: () => import('./tfd/pages/roles-page/roles-page').then( m => m.RolesPage)
                    },
                    {
                        path: 'unidades-hospitalares',
                        loadComponent: () => import('./tfd/pages/hospital-unities-page/hospital-unities-page').then( m => m.HospitalUnitiesPage)
                    },
                    {
                        path: 'sigtap',
                        loadComponent: () => import('./tfd/pages/sigtap-page/sigtap-page').then( m => m.SigtapPage)
                    },
                    {
                        path: 'configuracoes',
                        loadComponent: () => import('./tfd/pages/settings-page/settings-page').then( m => m.SettingsPage)
                    },
                    {
                        path: 'pacientes',
                        loadComponent: () => import('./tfd/pages/patients-page/patients-page').then( m => m.PatientsPage)
                    },
                    {
                        path: 'solicitacoes',
                        loadComponent: () => import('./tfd/pages/patient-requests-page/patient-requests-page').then( m => m.PatientRequestsPage)
                    },
                    {
                        path: 'consultar-paciente',
                        loadComponent: () => import('./tfd/pages/search-patient-page/search-patient-page').then( m => m.SearchPatientPage)
                    },
                    {
                        path: 'consultar-arquivo',
                        loadComponent: () => import('./tfd/pages/search-archive-page/search-archive-page').then( m => m.SearchArchivePage)
                    },
                    {
                        path: 'pareceres',
                        loadComponent: () => import('./tfd/pages/opinions-page/opinions-page').then( m => m.OpinionsPage)
                    },
                    {
                        path: 'passagens',
                        loadComponent: () => import('./tfd/pages/travels-page/travels-page').then( m => m.TravelsPage)
                    },
                    {
                        path: 'ajudas-de-custo',
                        loadComponent: () => import('./tfd/pages/cost-assistances-page/cost-assistances-page').then( m => m.CostAssistancesPage)
                    },
                    {
                        path: 'prestacoes-de-conta',
                        loadComponent: () => import('./tfd/pages/accountabilities-page/accountabilities-page').then( m => m.AccountabilitiesPage)
                    },
                    {
                        path: 'pagamentos',
                        loadComponent: () => import('./tfd/pages/payments-page/payments-page').then( m => m.PaymentsPage)
                    },
                ]
            },
            {
                path: 'homecare',
                component: HomecareLayout,
                canActivateChild: [moduleGuard],
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
                ]
            }
        ]
    }
];
