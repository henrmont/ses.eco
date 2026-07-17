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

// Components (Dialogs)
import { DeleteRoleComponent } from '../../components/role/delete-role-component/delete-role-component';
import { UpdateRoleComponent } from '../../components/role/update-role-component/update-role-component';

const TFD_ROLES_CHANNEL = new BroadcastChannel('tfd-roles-channel');

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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RolesPage implements OnInit, OnDestroy {
  // Injeções de dependência
  private readonly roleService = inject(RoleService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  // Propriedades expostas para o Template
  protected readonly displayedColumns: string[] = ['name', 'actions'];
  protected readonly rawList = signal<Role[]>([]);
  protected readonly dataSource = computed(() => new MatTableDataSource(this.rawList()));

  ngOnInit(): void {
    this.fetchRoles(true);

    TFD_ROLES_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.fetchRoles(false);
      }
    };
  }

  ngOnDestroy(): void {
    TFD_ROLES_CHANNEL.close();
  }

  protected applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource().filter = filterValue.trim().toLowerCase();
  }

  private fetchRoles(showLoading = false): void {
    if (showLoading) this.openLoading();

    this.roleService.getRoles()
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
          this.rawList.set(response || []);
        },
        error: () => {}
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

    const hasPermission = this.currentUser.roles.some((role: any) =>
      role.permissions?.some((perm: Permission) => perm.name === permissionName)
    );

    return !hasPermission;
  }

  protected ownerRole(role: Role): boolean {
    if (!this.currentUser?.roles) return false;
    const ownerRoleNames = this.currentUser.roles.map((item: any) => item.name);
    return ownerRoleNames.includes(role.name);
  }

  private openDialog(component: any, data: any, width = '400px', height = 'auto', requiresRefresh = true): void {
    this.dialog.open(component, {
      width,
      height,
      disableClose: true,
      autoFocus: false,
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result && requiresRefresh) {
          this.handleRoleChange();
        }
      });
  }

  private handleRoleChange(): void {
    this.fetchRoles(false);
    TFD_ROLES_CHANNEL.postMessage('update');
  }

  // Métodos de ação do template HTML
  protected updateRole(role: Role): void { this.openDialog(UpdateRoleComponent, { role }, '900px'); }
  protected deleteRole(role: Role): void { this.openDialog(DeleteRoleComponent, { role }); }
}