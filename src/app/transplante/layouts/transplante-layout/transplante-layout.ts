import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Modais (Dialogs)
import { CreateUserComponent } from '../../components/user/create-user-component/create-user-component';
import { CreateRoleComponent } from '../../components/role/create-role-component/create-role-component';
import { CreatePatientComponent } from '../../components/patient/create-patient-component/create-patient-component';

// Interfaces estruturais para o Menu
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

// Broadcast Channels Centralizados
const CHANNELS = {
  USERS: new BroadcastChannel('transplante-users-channel'),
  ROLES: new BroadcastChannel('transplante-roles-channel'),
  PATIENTS: new BroadcastChannel('transplante-patients-channel'),
};

@Component({
  selector: 'app-transplante-layout',
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
  templateUrl: './transplante-layout.html',
  styleUrl: './transplante-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance ativada por padrão
})
export class TransplanteLayout {
  // 🔒 Injeções de dependência modernas via inject()
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Mapa de navegação dinâmico e centralizado do Homecare
   */
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
      subHeader: 'Pacientes',
      requiredRoles: ['paciente listar', 'paciente criar'],
      items: [
        { label: 'Pacientes', icon: 'personal_injury', permissions: ['paciente listar'], routerLink: ['pacientes'] },
        { label: 'Novo paciente', icon: 'person_add', permissions: ['paciente criar'], action: () => this.createPatient() }
      ]
    }
  ];

  /**
   * Verifica as permissões baseando-se no snapshot da rota de forma puramente declarativa (.some())
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
   * ⚡ Método genérico e centralizado para abertura de Modais protegidas contra memory leak
   */
  private openDialog(component: any, width = '700px', height = 'auto', channel?: BroadcastChannel): void {
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

  // --- MÉTODOS DE AÇÃO DO TEMPLATE HTML ---

  private createUser(): void {
    this.openDialog(CreateUserComponent, '700px', 'auto', CHANNELS.USERS);
  }

  private createRole(): void {
    this.openDialog(CreateRoleComponent, '900px', 'auto', CHANNELS.ROLES);
  }

  private createPatient(): void {
    this.openDialog(CreatePatientComponent, '1200px', '700px', CHANNELS.PATIENTS);
  }
}