import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

// Serviços e Componentes
import { MessageService } from '../../../core/services/message-service';
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { DatasusService } from '../../services/datasus-service';

// Modais (Dialogs)
import { CreateUserComponent } from '../../components/user/create-user-component/create-user-component';
import { CreateRoleComponent } from '../../components/role/create-role-component/create-role-component';
import { CreateHospitalUnityComponent } from '../../components/hospital-unity/create-hospital-unity-component/create-hospital-unity-component';
import { CreatePatientComponent } from '../../components/patient/create-patient-component/create-patient-component';
import { CreatePatientRequestComponent } from '../../components/patient-request/create-patient-request-component/create-patient-request-component';
import { ImportTravelsComponent } from '../../components/travel/import-travels-component/import-travels-component';

// Broadcast Channels Centralizados
const CHANNELS = {
  ROLES: new BroadcastChannel('tfd-roles-channel'),
  USERS: new BroadcastChannel('tfd-users-channel'),
  HOSPITALS: new BroadcastChannel('tfd-hospital-unities-channel'),
  SIGTAP: new BroadcastChannel('tfd-sigtap-channel'),
  PATIENTS: new BroadcastChannel('tfd-patients-channel'),
  REQUESTS: new BroadcastChannel('tfd-patient-requests-channel'),
  TRAVELS: new BroadcastChannel('tfd-travels-channel'),
};

// Adicione esta interface (opcional, mas recomendada para tipagem)
interface MenuItem {
  label: string;
  icon: string;
  permissions: string[];
  routerLink?: string[];
  action?: () => void;
}

interface MenuGroup {
  subHeader: string;
  requiredRoles: string[];
  items: MenuItem[];
}

@Component({
  selector: 'app-tfd-layout',
  standalone: true,
  imports: [
    CommonModule, 
    MatSidenavModule, 
    MatListModule, 
    MatIconModule, 
    RouterModule, 
    MatMenuModule,
    MatDialogModule
  ],
  templateUrl: './tfd-layout.html',
  styleUrl: './tfd-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TfdLayout {
  // 🔒 Injeções de dependência modernas via inject()
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly messageService = inject(MessageService);
  private readonly datasusService = inject(DatasusService);
  private readonly destroyRef = inject(DestroyRef);

  // Captura do input HTML via Signal reativo (viewChild)
  protected readonly competence = viewChild.required<ElementRef>('competence');
  
  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly selectedFile = signal<File | null>(null);

  /**
   * Verifica as permissões baseando-se no snapshot da rota atual de forma puramente declarativa.
   */
  protected checkPermission(names: string[]): boolean {
    const module = this.route.snapshot.routeConfig?.path;
    const roles = this.route.parent?.snapshot.data['user']?.roles || [];
    
    return roles.some((role: any) => {
      const permissions: string[] = role.permissions?.map((p: any) => p.name) || [];
      return names.some(name => permissions.includes(`${module}/${name}`));
    });
  }

  /**
   * Dispara o clique programático no input oculto de arquivos
   */
  protected importCompetence(): void {
    this.competence().nativeElement.click();
  }

  /**
   * Gerencia o upload e processamento do arquivo ZIP do Datasus
   */
  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files && files.length > 0 && files[0].type === 'application/zip') {
      this.openLoading();
      this.selectedFile.set(files[0]);
      
      this.datasusService.process(this.selectedFile()!)
        .pipe(
          finalize(() => {
            if (this.loadingDialog) this.loadingDialog.close();
            input.value = ''; // Limpa o input para permitir re-upload do mesmo arquivo
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (response) => {
            this.messageService.showMessage(response.message);
            CHANNELS.SIGTAP.postMessage('update');
          },
          error: (error) => {
            const fallbackError = error?.error?.message || 'Erro ao processar arquivo';
            this.messageService.showMessage(fallbackError);
          },
        });
    } else {
      input.value = '';
    }
  }

  private openLoading(): void {
    this.loadingDialog = this.dialog.open(LoadingComponent, {
      height: '200px',
      disableClose: true,
      autoFocus: false,
    });
  }

  /**
   * ⚡ Método genérico, privado e centralizado para abertura de Modais (Design Pattern idêntico à sua referência)
   */
  private openDialog(component: any, width = '500px', height = 'auto', channel?: BroadcastChannel): void {
    this.dialog.open(component, {
      width,
      height,
      disableClose: true,
      autoFocus: false,
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result && channel) {
          channel.postMessage('update');
        }
      });
  }

  // --- MENU DO TEMPLATE HTML ---

  protected readonly menuGroups: MenuGroup[] = [
    {
      subHeader: 'Usuários',
      requiredRoles: ['usuário listar', 'usuário criar'],
      items: [
        { label: 'Usuários', icon: 'groups', permissions: ['usuário listar'], routerLink: ['usuarios'] },
        { label: 'Novo usuário', icon: 'person_add', permissions: ['usuário criar'], action: () => this.createUser() }
      ]
    },
    {
      subHeader: 'Regras',
      requiredRoles: ['regra listar', 'regra criar'],
      items: [
        { label: 'Regras', icon: 'security', permissions: ['regra listar'], routerLink: ['regras'] },
        { label: 'Nova regra', icon: 'add_moderator', permissions: ['regra criar'], action: () => this.createRole() }
      ]
    },
    {
      subHeader: 'Unidades hospitalares',
      requiredRoles: ['unidade hospitalar listar', 'unidade hospitalar criar'],
      items: [
        { label: 'Unidades hospitalares', icon: 'domain', permissions: ['unidade hospitalar listar'], routerLink: ['unidades-hospitalares'] },
        { label: 'Nova unidade hospitalar', icon: 'domain_add', permissions: ['unidade hospitalar criar'], action: () => this.createHospitalUnity() }
      ]
    },
    {
      subHeader: 'Datasus',
      requiredRoles: ['datasus listar', 'datasus importar'],
      items: [
        { label: 'Sigtap', icon: 'medical_services', permissions: ['datasus listar'], routerLink: ['sigtap'] },
        { label: 'Importar competência', icon: 'upload', permissions: ['datasus importar'], action: () => this.importCompetence() }
      ]
    },
    {
      subHeader: 'Configurações',
      requiredRoles: ['configuração listar'],
      items: [
        { label: 'Configurações', icon: 'settings', permissions: ['configuração listar'], routerLink: ['configuracoes'] }
      ]
    },
    {
      subHeader: 'Pacientes',
      requiredRoles: ['paciente listar', 'paciente criar'],
      items: [
        { label: 'Pacientes', icon: 'personal_injury', permissions: ['paciente listar'], routerLink: ['pacientes'] },
        { label: 'Novo paciente', icon: 'person_add', permissions: ['paciente criar'], action: () => this.createPatient() }
      ]
    },
    {
      subHeader: 'Solicitações',
      requiredRoles: ['solicitação listar', 'solicitação criar'],
      items: [
        { label: 'Solicitações', icon: 'assignment', permissions: ['solicitação listar'], routerLink: ['solicitacoes'] },
        { label: 'Nova solicitação', icon: 'post_add', permissions: ['solicitação criar'], action: () => this.createPatientRequest() }
      ]
    },
    {
      subHeader: 'Pareceres',
      requiredRoles: ['parecer listar'],
      items: [
        { label: 'Pareceres técnicos', icon: 'grading', permissions: ['parecer listar'], routerLink: ['pareceres'] }
      ]
    },
    {
      subHeader: 'Passagens',
      requiredRoles: ['passagem listar', 'passagem criar'],
      items: [
        { label: 'Importar passagens', icon: 'connecting_airports', permissions: ['passagem criar'], action: () => this.importTravels() },
        { label: 'Viagens', icon: 'luggage', permissions: ['passagem listar'], routerLink: ['passagens'] }
      ]
    },
    {
      subHeader: 'Ajuda de custo',
      requiredRoles: ['ajuda de custo listar'],
      items: [
        { label: 'Ajuda de custo', icon: 'price_check', permissions: ['ajuda de custo listar'], routerLink: ['ajudas-de-custo'] },
        { label: 'Prestação de contas', icon: 'receipt_long', permissions: ['ajuda de custo listar'], routerLink: ['prestacoes-de-conta'] }
      ]
    },
    {
      subHeader: 'Pagamentos',
      requiredRoles: ['pagamento listar'],
      items: [
        { label: 'Pagamentos', icon: 'payments', permissions: ['pagamento listar'], routerLink: ['pagamentos'] }
      ]
    },
    {
      subHeader: 'Consultar',
      requiredRoles: ['consultar paciente', 'consultar arquivo'],
      items: [
        { label: 'Paciente', icon: 'person_search', permissions: ['consultar paciente'], routerLink: ['consultar-paciente'] },
        { label: 'Arquivo', icon: 'inventory_2', permissions: ['consultar arquivo'], routerLink: ['consultar-arquivo'] }
      ]
    }
  ];

  // --- MÉTODOS DE AÇÃO DO TEMPLATE HTML ---

  protected createUser(): void {
    this.openDialog(CreateUserComponent, '700px', 'auto', CHANNELS.USERS);
  }

  protected createRole(): void {
    this.openDialog(CreateRoleComponent, '900px', 'auto', CHANNELS.ROLES);
  }

  protected createHospitalUnity(): void {
    this.openDialog(CreateHospitalUnityComponent, '500px', 'auto', CHANNELS.HOSPITALS);
  }
        
  protected createPatient(): void {
    this.openDialog(CreatePatientComponent, '1200px', '700px', CHANNELS.PATIENTS);
  }

  protected createPatientRequest(): void {
    this.openDialog(CreatePatientRequestComponent, '800px', 'auto', CHANNELS.REQUESTS);
  }

  protected importTravels(): void {
    this.openDialog(ImportTravelsComponent, '400px', 'auto', CHANNELS.TRAVELS);
  }
}