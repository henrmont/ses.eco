import { 
  ChangeDetectionStrategy, 
  Component, 
  DestroyRef, 
  OnDestroy, 
  OnInit, 
  computed, 
  inject, 
  signal, 
  viewChild 
} from '@angular/core';
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
import { Overlay } from '@angular/cdk/overlay';

// Core & Shared
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { Permission } from '../../models/permission.model';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { UserLockComponent } from '../../components/user/user-lock/user-lock.component';
import { UserValidateComponent } from '../../components/user/user-validate/user-validate.component';
import { UserRolesComponent } from '../../components/user/user-roles/user-roles.component';
import { UserDeleteComponent } from '../../components/user/user-delete/user-delete.component';
import { UserUpdateComponent } from '../../components/user/user-update/user-update.component';
import { UserDetailComponent } from '../../components/user/user-detail/user-detail.component';

// Dialog Components (Nomenclatura Atualizada da Etapa 1)

const TFD_USERS_CHANNEL = new BroadcastChannel('tfd-users-channel');

export interface UserTableRow extends User {
  isEditable: boolean;
}

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
  templateUrl: './users.page.html',
  styleUrl: './users.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPage implements OnInit, OnDestroy {
  // Injeções de Dependência
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser: User | undefined = this.route.parent?.parent?.snapshot.data['user'];

  // View Children
  private readonly userSort = viewChild<MatSort>('userSort');
  private readonly userPaginator = viewChild<MatPaginator>('userPaginator');
  
  // Colunas da Tabela
  protected readonly displayedColumns: string[] = [
    'is_editable', 
    'email', 
    'name', 
    'type', 
    'is_valid', 
    'actions'
  ];
  
  // Estado Reativo (Signals com Tipagem Forte)
  private readonly rawList = signal<UserTableRow[]>([]);

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

    TFD_USERS_CHANNEL.onmessage = (message: MessageEvent<string>) => {
      if (message.data === 'update') {
        this.fetchUsers(false);
      }
    };
  }

  ngOnDestroy(): void {
    TFD_USERS_CHANNEL.close();
  }

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
          const mappedUsers = rawData.map(item => this.mapUserToRow(item));
          this.rawList.set(mappedUsers);
        },
        error: () => {
          this.rawList.set([]);
        }
      });
  }

  /**
   * Mapeador de Dados (Lógica de apresentação temporária até migração total para a API)
   */
  private mapUserToRow(item: any): UserTableRow {
    const userObj: User = {
      id: item.id,
      email: item.email,
      name: item.professional?.name || item.name,
      type: item.professional?.type || 'Não alocado',
      module: item.module,
      professional: item.professional,
      roles: item.roles
    };

    return {
      ...userObj,
      isEditable: this.calculateEditable(userObj)
    };
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

  private openLoading(): void {
    this.loadingDialog = this.dialog.open(LoadingComponent, {
      height: '200px',
      disableClose: true,
      autoFocus: false,
    });
  }

  private openDialog<T>(
    component: new (...args: any[]) => T, 
    data: { user: User }, 
    width = '400px', 
    height = 'auto', 
    requiresRefresh = true
  ): void {
    this.dialog.open(component, {
      width,
      height,
      disableClose: true,
      autoFocus: false,
      scrollStrategy: this.overlay.scrollStrategies.noop(),
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

  // Ações do Template
  protected userLock(user: User): void { this.openDialog(UserLockComponent, { user }); }
  protected userValidate(user: User): void { this.openDialog(UserValidateComponent, { user }); }
  protected userRoles(user: User): void { this.openDialog(UserRolesComponent, { user }, '700px'); }
  protected userDelete(user: User): void { this.openDialog(UserDeleteComponent, { user }); }
  protected userUpdate(user: User): void { this.openDialog(UserUpdateComponent, { user }, '700px'); }
  protected userDetail(user: User): void { this.openDialog(UserDetailComponent, { user }, '700px'); }
}