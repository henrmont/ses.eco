// admin.routes.ts
import { Routes } from '@angular/router';

export const homecareRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./../pages/index-page/index-page').then( m => m.IndexPage)
    },
    {
        path: 'usuarios',
        loadComponent: () => import('./../pages/users-page/users.page').then( m => m.UsersPage),
        data: { permission: 'homecare/usuário listar' } // Adicionado
    },
    {
        path: 'regras',
        loadComponent: () => import('./../pages/roles-page/roles.page').then( m => m.RolesPage),
        data: { permission: 'homecare/regra listar' } // Adicionado
    },
    {
        path: 'pacientes',
        loadComponent: () => import('./../pages/patients-page/patients.page').then( m => m.PatientsPage),
        data: { permission: 'homecare/paciente listar' } // Adicionado
    },
    {
        path: 'arquivo-pacientes',
        loadComponent: () => import('./../pages/archive-patients-page/archive-patients.page').then( m => m.ArchivePatientsPage),
        data: { permission: 'homecare/paciente listar' } // Adicionado
    },
];