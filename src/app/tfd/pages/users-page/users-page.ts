import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, signal, inject, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; // 👈 Essencial para gerenciar o ciclo de vida do subscribe de forma moderna
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs'; // 👈 Importado para garantir o fechamento seguro do loading
import { UserService } from '../../services/user-service';
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { User } from '../../models/user';
import { Permission } from '../../models/permission';

// Componentes de Dialogs (Sincronizados e limpos)
import { LockUserComponent } from '../../components/user/lock-user-component/lock-user-component';
import { ValidateUserComponent } from '../../components/user/validate-user-component/validate-user-component';
import { ShowUserComponent } from '../../components/user/show-user-component/show-user-component';
import { RolesUserComponent } from '../../components/user/roles-user-component/roles-user-component';
import { DeleteUserComponent } from '../../components/user/delete-user-component/delete-user-component';
import { UpdateUserComponent } from '../../components/user/update-user-component/update-user-component';

@Component({
  selector: 'app-users-page',
  // standalone: true 👈 Removido (Padrão nativo e implícito na v21)
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPage implements OnInit, OnDestroy {
  // 🔒 Injeções de dependência imutáveis e padronizadas
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef); // 👈 Injetado para o controle automático de desassinatura

  private readonly channel = new BroadcastChannel('tfd-users-channel');
  private loadingDialog!: MatDialogRef<LoadingComponent>;

  displayedColumns: string[] = ['is_editable', 'email', 'name', 'type', 'is_valid', 'actions'];
  
  // Guardamos a lista bruta mapeada num Signal puro
  readonly usersList = signal<any[]>([]);

  // Computed Signal: Sempre que usersList mudar, ele recria o DataSource de forma performática
  readonly dataSource = computed(() => new MatTableDataSource(this.usersList()));

  // Cache das permissões logadas para evitar loops no template
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  ngOnInit(): void {
    this.getUsers(true); // Ativa o loading na primeira carga

    // Ouvindo o canal de broadcast com segurança
    this.channel.onmessage = (message) => {
      if (message.data === 'update') {
        this.getUsers(false); // Atualiza em background de forma silenciosa
      }
    };
  }

  ngOnDestroy(): void {
    // Evita vazamento de memória fechando o canal ao destruir o componente
    this.channel.close();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource().filter = filterValue.trim().toLowerCase();
  }

  // DRY (Don't Repeat Yourself): Unificamos a busca e o mapeamento dos dados do Laravel
  getUsers(showLoading = false): void {
    if (showLoading) this.showLoading();

    this.userService.getUsers()
      .pipe(
        // 🌟 Remove de forma segura o Dialog de carregamento mesmo se a API falhar (Evita tela travada)
        finalize(() => {
          if (showLoading && this.loadingDialog) {
            this.loadingDialog.close();
          }
        }),
        // 🌟 Destrói automaticamente a inscrição se o usuário mudar de rota enquanto a requisição carrega
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          const mappedUsers = response.map((item: any) => {
            const userObj: User = {
              id: item.id,
              email: item.email,
              name: item.professional?.name || item.name,
              type: item.professional?.type || 'Não alocado',
              module: item.modules?.[0],
              professional: item.professional,
              roles: item.roles
            };

            // O pulo do gato mantido com sucesso total!
            return {
              ...userObj,
              isEditable: this.calculateEditable(userObj)
            };
          });

          this.usersList.set(mappedUsers);
        },
        error: () => {
          // Trate o erro de carregamento amigavelmente aqui se achar necessário
        }
      });
  }

  private showLoading(): void {
    this.loadingDialog = this.dialog.open(LoadingComponent, {
      height: '200px',
      disableClose: true,
      autoFocus: false,
    });
  }

  // Refatorado para processamento interno no TypeScript
  private calculateEditable(user: User): boolean {
    if (!this.currentUser || this.currentUser.id === user.id) return false;
    return !user.module?.pivot?.is_editable;
  }

  checkPermissions(name: string): boolean {
    if (!this.currentUser?.roles) return true;
    return !this.currentUser.roles.some((role: any) => 
      role.permissions.some((p: Permission) => p.name === name)
    );
  }

  // Centralizador de abertura de dialogs com tratamento correto de ciclo de vida reativo
  private openDialog(component: any, data: any, width = '400px'): void {
    this.dialog.open(component, {
      width,
      disableClose: true,
      autoFocus: false,
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef)) // 👈 Protegendo o fluxo assíncrono pós-fechamento do dialog
      .subscribe(result => {
        if (result) {
          this.getUsers(false);
          this.channel.postMessage('update');
        }
      });
  }

  // Métodos de ação extremamente limpos e fáceis de ler:
  lockUser(user: User): void { this.openDialog(LockUserComponent, { user }); }
  validateUser(user: User): void { this.openDialog(ValidateUserComponent, { user }); }
  rolesUser(user: User): void { this.openDialog(RolesUserComponent, { user }); }
  deleteUser(user: User): void { this.openDialog(DeleteUserComponent, { user }); }
  updateUser(user: User): void { this.openDialog(UpdateUserComponent, { user }, '700px'); }
  showUser(user: User): void { this.openDialog(ShowUserComponent, { user }, '700px'); }
}