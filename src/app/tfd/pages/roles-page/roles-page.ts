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
import { Overlay } from '@angular/cdk/overlay';

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
  templateUrl: './roles-page.html',
  styleUrl: './roles-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RolesPage implements OnInit, OnDestroy {
  // Injeções de dependência Dinâmicas
  private readonly roleService = inject(RoleService);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser = this.route.parent?.parent?.snapshot.data['user'];

  // Capturas nomeadas e isoladas das diretivas do template HTML
  private readonly roleSort = viewChild<MatSort>('roleSort');
  private readonly rolePaginator = viewChild<MatPaginator>('rolePaginator');
  
  // Definições de Estrutura de Colunas expostas ao Template
  protected readonly displayedColumns: string[] = ['name', 'actions'];
  
  // Signals internos para gerenciamento do estado bruto
  private readonly rawList = signal<Role[]>([]);

  // Computed signals criando os DataSources e acoplando o Sort/Paginator de forma reativa
  protected readonly dataSource = computed(() => {
    const dataSource = new MatTableDataSource(this.rawList());
    const sortRef = this.roleSort();
    const paginatorRef = this.rolePaginator();

    if (sortRef) dataSource.sort = sortRef;
    if (paginatorRef) dataSource.paginator = paginatorRef;

    return dataSource;
  });

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

  // Métodos de Filtragem expostos para as tabelas
  protected applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    const dataSource = this.dataSource();
    dataSource.filter = filterValue.trim().toLowerCase();
    if (dataSource.paginator) {
      dataSource.paginator.firstPage();
    }
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

  /**
   * Centralizador genérico para abertura de modais com recarga automatizada de dados.
   */
  private openDialog(component: any, data: any, width = '400px', height = 'auto', requiresRefresh = true): void {
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
          this.handleRoleChange();
        }
      });
  }

  private handleRoleChange(): void {
    this.fetchRoles(false);
    TFD_ROLES_CHANNEL.postMessage('update');
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---
  protected updateRole(role: Role): void { this.openDialog(UpdateRoleComponent, { role }, '900px'); }
  protected deleteRole(role: Role): void { this.openDialog(DeleteRoleComponent, { role }); }
}