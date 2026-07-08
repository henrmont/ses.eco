import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

// Core & Shared
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { Permission } from '../../models/permission';
import { Role } from '../../models/role';
import { RoleService } from '../../services/role-service';

// Componentes de Dialogs (Alinhados com a nova estrutura)

const HOMECARE_ROLES_CHANNEL = new BroadcastChannel('homecare-roles-channel');

@Component({
  selector: 'app-roles-page',
  imports: [
    MatFormFieldModule, 
    MatInputModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule
  ],
  templateUrl: './roles-page.html',
  styleUrl: './roles-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ OnPush para máxima performance com Signals
})
export class RolesPage implements OnInit, OnDestroy {
  // 🔒 Injeções de dependência imutáveis e modernas via inject()
  private readonly roleService = inject(RoleService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef); // Controle automático de desassinatura

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  
  // Cache das informações do usuário logado para evitar loops custosos no HTML
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  // Propriedades expostas para o Template
  protected readonly displayedColumns: string[] = ['name', 'actions'];
  
  // Lista bruta armazenada em um Signal puro
  protected readonly rolesList = signal<Role[]>([]);

  // Computed Signal: Recria e atualiza o DataSource de forma reativa e performática
  protected readonly dataSource = computed(() => new MatTableDataSource(this.rolesList()));

  ngOnInit(): void {
    this.getRoles(true); // Ativa o loading na primeira carga

    // Ouvindo o canal de broadcast com segurança
    HOMECARE_ROLES_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.getRoles(false); // Atualiza em background de forma silenciosa
      }
    };
  }

  ngOnDestroy(): void {
    // Evita vazamento de memória fechando o canal
    HOMECARE_ROLES_CHANNEL.close();
  }

  protected applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource().filter = filterValue.trim().toLowerCase();
  }

  // Busca unificada com tratamento seguro de Loading e Desassinatura
  private getRoles(showLoading = false): void {
    if (showLoading) this.openLoading();

    this.roleService.getRoles()
      .pipe(
        finalize(() => {
          if (showLoading && this.loadingDialog) {
            this.loadingDialog.close();
          }
        }),
        takeUntilDestroyed(this.destroyRef) // Cancela a requisição se o usuário sair da página
      )
      .subscribe({
        next: (response) => {
          this.rolesList.set(response);
        },
        error: () => {
          // Espaço para tratamento amigável de erros se necessário
        }
      });
  }

  private openLoading(): void {
    this.loadingDialog = this.dialog.open(LoadingComponent, {
      height: '200px',
      disableClose: true,
      autoFocus: false,
    });
  }

  protected checkPermissions(permissionName: string): boolean {
    if (!this.currentUser?.roles) return true;
    return !this.currentUser.roles.some((role: any) => 
      role.permissions.some((p: Permission) => p.name === permissionName)
    );
  }

  protected ownerRole(role: Role): boolean {
    if (!this.currentUser?.roles) return false;
    const ownerRoleNames = this.currentUser.roles.map((item: any) => item.name);
    return ownerRoleNames.includes(role.name);
  }

  // Centralizador de abertura de dialogs com tratamento RXJS limpo
  private openDialog(component: any, data: any, width = '400px'): void {
    this.dialog.open(component, {
      width,
      disableClose: true,
      autoFocus: false,
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef)) // Protege o fluxo pós-fechamento
      .subscribe(result => {
        if (result) {
          this.handleRoleChange();
        }
      });
  }

  private handleRoleChange(): void {
    this.getRoles(false);
    HOMECARE_ROLES_CHANNEL.postMessage('update');
  }

  // Métodos de ação extremamente enxutos para o HTML
  // protected updateRole(role: Role): void { this.openDialog(UpdateRoleComponent, { role }, '900px'); }
  // protected deleteRole(role: Role): void { this.openDialog(DeleteRoleComponent, { role }, '400px'); }
}