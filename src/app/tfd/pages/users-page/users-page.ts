import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

// Angular Material & CDK
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSort, MatSortModule } from '@angular/material/sort'; 
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'; 
import { Overlay } from '@angular/cdk/overlay'; // ➕ Incluído o import do CDK Overlay

// Core & Shared
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { Permission } from '../../models/permission';
import { User } from '../../models/user';
import { UserService } from '../../services/user-service';

// Components (Dialogs)
import { DeleteUserComponent } from '../../components/user/delete-user-component/delete-user-component';
import { LockUserComponent } from '../../components/user/lock-user-component/lock-user-component';
import { RolesUserComponent } from '../../components/user/roles-user-component/roles-user-component';
import { ShowUserComponent } from '../../components/user/show-user-component/show-user-component';
import { UpdateUserComponent } from '../../components/user/update-user-component/update-user-component';
import { ValidateUserComponent } from '../../components/user/validate-user-component/validate-user-component';

const TFD_USERS_CHANNEL = new BroadcastChannel('tfd-users-channel');

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    MatFormFieldModule, 
    MatInputModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule,
    MatSortModule,
    MatPaginatorModule
  ],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPage implements OnInit, OnDestroy {
  // Injeções de dependência Dinâmicas
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay); // ➕ Injetado seguindo a referência
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  // Capturas nomeadas e isoladas das diretivas do template HTML
  private readonly userSort = viewChild<MatSort>('userSort');
  private readonly userPaginator = viewChild<MatPaginator>('userPaginator');
  
  // Definições de Estrutura de Colunas expostas ao Template
  protected readonly displayedColumns: string[] = ['is_editable', 'email', 'name', 'type', 'is_valid', 'actions'];
  
  // Signals internos para gerenciamento do estado bruto
  private readonly rawList = signal<any[]>([]);

  // Computed signals criando os DataSources e acoplando o Sort/Paginator de forma reativa
  protected readonly dataSource = computed(() => {
    const dataSource = new MatTableDataSource(this.rawList());
    const sortRef = this.userSort();
    const paginatorRef = this.userPaginator();

    if (sortRef) dataSource.sort = sortRef;
    if (paginatorRef) dataSource.paginator = paginatorRef;

    return dataSource;
  });

  ngOnInit(): void {
    this.fetchUsers(true);

    TFD_USERS_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.fetchUsers(false);
      }
    };
  }

  ngOnDestroy(): void {
    TFD_USERS_CHANNEL.close();
  }

  // Métodos de Filtragem expostos para as tabelas
  protected applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    const dataSource = this.dataSource();
    dataSource.filter = filterValue.trim().toLowerCase();
    if (dataSource.paginator) {
      dataSource.paginator.firstPage();
    }
  }

  private fetchUsers(showLoading = false): void {
    if (showLoading) this.openLoading();

    this.userService.getUsers()
      .pipe(
        finalize(() => {
          if (showLoading && this.loadingDialog) {
            this.loadingDialog.close();
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          const rawData = response || [];

          const mappedUsers = rawData.map((item: any) => {
            const userObj: User = {
              id: item.id,
              email: item.email,
              name: item.professional?.name || item.name,
              type: item.professional?.type || 'Não alocado',
              module: item.modules?.[0],
              professional: item.professional,
              roles: item.roles
            };

            return {
              ...userObj,
              isEditable: this.calculateEditable(userObj)
            };
          });

          this.rawList.set(mappedUsers);
        },
        error: () => {
          this.rawList.set([]);
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

  private calculateEditable(user: User): boolean {
    if (!this.currentUser || this.currentUser.id === user.id) return false;
    return !user.module?.pivot?.is_editable;
  }

  protected checkPermissions(permissionName: string): boolean {
    if (!this.currentUser?.roles) return true;

    const hasPermission = this.currentUser.roles.some((role: any) =>
      role.permissions?.some((perm: Permission) => perm.name === permissionName)
    );

    return !hasPermission;
  }

  /**
   * Centralizador genérico para abertura de modais com recarga automatizada de dados.
   */
  private openDialog(component: any, data: any, width = '400px', height = 'auto', requiresRefresh = true): void {
    this.dialog.open(component, {
      width,
      height,
      disableClose: true,
      autoFocus: false,
      scrollStrategy: this.overlay.scrollStrategies.noop(), // ➕ Corrigido aqui!
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result && requiresRefresh) {
          this.handleUserChange();
        }
      });
  }

  private handleUserChange(): void {
    this.fetchUsers(false);
    TFD_USERS_CHANNEL.postMessage('update');
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---
  protected lockUser(user: User): void { this.openDialog(LockUserComponent, { user }); }
  protected validateUser(user: User): void { this.openDialog(ValidateUserComponent, { user }); }
  protected rolesUser(user: User): void { this.openDialog(RolesUserComponent, { user }, '700px'); }
  protected deleteUser(user: User): void { this.openDialog(DeleteUserComponent, { user }); }
  protected updateUser(user: User): void { this.openDialog(UpdateUserComponent, { user }, '700px'); }
  protected showUser(user: User): void { this.openDialog(ShowUserComponent, { user }, '700px'); }
}