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
import { User } from '../../models/user';
import { UserService } from '../../services/user-service';

// Components (Dialogs)
// import { DeleteUserComponent } from '../../components/user/delete-user-component/delete-user-component';
// import { LockUserComponent } from '../../components/user/lock-user-component/lock-user-component';
import { RolesUserComponent } from '../../components/user/roles-user-component/roles-user-component';
// import { ShowUserComponent } from '../../components/user/show-user-component/show-user-component';
// import { UpdateUserComponent } from '../../components/user/update-user-component/update-user-component';
// import { ValidateUserComponent } from '../../components/user/validate-user-component/validate-user-component';

const HOMECARE_USERS_CHANNEL = new BroadcastChannel('homecare-users-channel');

@Component({
  selector: 'app-users-page',
  imports: [
    MatFormFieldModule, 
    MatInputModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule
  ],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPage implements OnInit, OnDestroy {
  // Injeções de dependência
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];
  
  // Propriedades expostas para o Template
  protected readonly displayedColumns: string[] = ['is_editable', 'email', 'name', 'type', 'is_valid', 'actions'];
  protected readonly usersList = signal<any[]>([]);
  protected readonly dataSource = computed(() => new MatTableDataSource(this.usersList()));

  ngOnInit(): void {
    this.getUsers(true);

    HOMECARE_USERS_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.getUsers(false);
      }
    };
  }

  ngOnDestroy(): void {
    HOMECARE_USERS_CHANNEL.close();
  }

  protected applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource().filter = filterValue.trim().toLowerCase();
  }

  private getUsers(showLoading = false): void {
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

            return {
              ...userObj,
              isEditable: this.calculateEditable(userObj)
            };
          });

          this.usersList.set(mappedUsers);
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
    return !this.currentUser.roles.some((role: any) => 
      role.permissions.some((p: Permission) => p.name === permissionName)
    );
  }

  private openDialog(component: any, data: any, width = '400px'): void {
    this.dialog.open(component, {
      width,
      disableClose: true,
      autoFocus: false,
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.handleUserChange();
        }
      });
  }

  private handleUserChange(): void {
    this.getUsers(false);
    HOMECARE_USERS_CHANNEL.postMessage('update');
  }

  // Métodos de ação do template HTML
  protected lockUser(user: User): void { }
  protected validateUser(user: User): void {  }
  protected rolesUser(user: User): void { this.openDialog(RolesUserComponent, { user }); }
  protected deleteUser(user: User): void { }
  protected updateUser(user: User): void {  }
  protected showUser(user: User): void {  }
}