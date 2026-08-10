// admin.routes.ts
import { Routes } from '@angular/router';

export const tfdRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./../pages/index-page/index-page').then( m => m.IndexPage)
    },
    {
        path: 'usuarios',
        loadComponent: () => import('./../pages/users-page/users.page').then( m => m.UsersPage),
        data: { permission: 'tfd/usuário listar' } // Adicionado
    },
    {
        path: 'regras',
        loadComponent: () => import('./../pages/roles-page/roles.page').then( m => m.RolesPage),
        data: { permission: 'tfd/regra listar' } // Adicionado
    },
    {
        path: 'unidades-hospitalares',
        loadComponent: () => import('./../pages/hospital-unities-page/hospital-unities-page').then( m => m.HospitalUnitiesPage),
        data: { permission: 'tfd/unidade hospitalar listar' } // Adicionado
    },
    {
        path: 'sigtap',
        loadComponent: () => import('./../pages/sigtap-page/sigtap-page').then( m => m.SigtapPage),
        data: { permission: 'tfd/datasus listar' } // Adicionado
    },
    {
        path: 'configuracoes',
        loadComponent: () => import('./../pages/settings-page/settings.page').then( m => m.SettingsPage),
        data: { permission: 'tfd/configuração listar' } // Adicionado
    },
    {
        path: 'pacientes',
        loadComponent: () => import('./../pages/patients-page/patients-page').then( m => m.PatientsPage),
        data: { permission: 'tfd/paciente listar' } // Adicionado
    },
    {
        path: 'arquivo-pacientes',
        loadComponent: () => import('./../pages/archive-patients-page/archive-patients-page').then( m => m.ArchivePatientsPage),
        data: { permission: 'tfd/paciente listar' } // Adicionado
    },
    {
        path: 'solicitacoes',
        loadComponent: () => import('./../pages/patient-requests-page/patient-requests-page').then( m => m.PatientRequestsPage),
        data: { permission: 'tfd/solicitação listar' } // Adicionado
    },
    {
        path: 'pareceres',
        loadComponent: () => import('./../pages/opinions-page/opinions-page').then( m => m.OpinionsPage),
        data: { permission: 'tfd/parecer listar' } // Adicionado
    },
    {
        path: 'arquivo-pareceres',
        loadComponent: () => import('./../pages/archive-opinion-patient-requests-page/archive-opinion-patient-requests-page').then( m => m.ArchiveOpinionPatientRequestsPage),
        data: { permission: 'tfd/parecer listar' } // Adicionado
    },
    {
        path: 'passagens',
        loadComponent: () => import('./../pages/travels-page/travels-page').then( m => m.TravelsPage),
        data: { permission: 'tfd/passagem listar' } // Adicionado
    },
    {
        path: 'arquivo-passagens',
        loadComponent: () => import('./../pages/archive-travel-patient-requests-page/archive-travel-patient-requests-page').then( m => m.ArchiveTravelPatientRequestsPage),
        data: { permission: 'tfd/passagem listar' } // Adicionado
    },
    {
        path: 'ajudas-de-custo',
        loadComponent: () => import('./../pages/cost-assistances-page/cost-assistances-page').then( m => m.CostAssistancesPage),
        data: { permission: 'tfd/ajuda de custo listar' } // Adicionado
    },
    {
        path: 'prestacoes-de-conta',
        loadComponent: () => import('./../pages/accountabilities-page/accountabilities-page').then( m => m.AccountabilitiesPage),
        data: { permission: 'tfd/ajuda de custo listar' } // Adicionado
    },
    {
        path: 'arquivo-prestacoes-de-conta',
        loadComponent: () => import('./../pages/archive-accountability-patient-requests-page/archive-accountability-patient-requests-page').then( m => m.ArchiveAccountabilityPatientRequestsPage),
        data: { permission: 'tfd/ajuda de custo listar' } // Adicionado
    },
    {
        path: 'pagamentos',
        loadComponent: () => import('./../pages/payments-page/payments-page').then( m => m.PaymentsPage),
        data: { permission: 'tfd/pagamento listar' } // Adicionado
    },
    {
        path: 'arquivo-pagamentos',
        loadComponent: () => import('./../pages/archive-payment-patient-requests-page/archive-payment-patient-requests-page').then( m => m.ArchivePaymentPatientRequestsPage),
        data: { permission: 'tfd/pagamento listar' } // Adicionado
    },
];