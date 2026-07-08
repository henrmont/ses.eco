import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { User } from '../../models/user';
import { Permission } from '../../models/permission';
import { UserService } from '../../services/user-service';
import { RolesUserComponent } from '../../components/user/roles-user-component/roles-user-component';

// 🌟 Importações presumidas dos seus componentes do Homecare (Ajuste os caminhos se necessário)
// import { LockUserComponent } from '../user/lock-user-component/lock-user-component';
// import { ValidateUserComponent } from '../user/validate-user-component/validate-user-component';
// import { ShowUserComponent } from '../user/show-user-component/show-user-component';
// import { RolesUserComponent } from '../user/roles-user-component/roles-user-component';
// import { UpdateUserComponent } from '../user/update-user-component/update-user-component';
// import { DeleteUserComponent } from '../user/delete-user-component/delete-user-component';

const TRANSPLANTE_USERS_CHANNEL = new BroadcastChannel('transplante-users-channel');

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
})
export class UsersPage implements OnInit, OnDestroy {
  // Injeções modernas com inject()
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);

  displayedColumns: string[] = ['is_editable', 'email', 'name', 'type', 'is_valid', 'actions'];
  dataSource = signal<MatTableDataSource<any>>(new MatTableDataSource());
  loadingDialog!: MatDialogRef<LoadingComponent>;

  constructor() {
    TRANSPLANTE_USERS_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.upgradeUsers();
      }
    };
  }

  ngOnInit(): void {
    this.getUsers();
  }

  ngOnDestroy(): void {
    // É uma boa prática fechar o canal para evitar vazamento de memória se a página for destruída
    // HOMECARE_USERS_CHANNEL.close(); 
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource().filter = filterValue.trim().toLowerCase();
  }

  private mapUserData(response: any[]): any[] {
    return response.map((item: any) => ({
      id: item.id,
      email: item.email,
      name: item.professional?.name || item.name,
      type: item.professional?.type || 'Não alocado',
      module: item.modules?.[0],
      professional: item.professional,
      roles: item.roles,
      is_active: item.is_active // Mantido caso usem para o lock/validate
    }));
  }

  getUsers(): void {
    this.loading();
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(this.mapUserData(response)));
      },
      complete: () => {
        if (this.loadingDialog) this.loadingDialog.close();
      }
    });
  }

  upgradeUsers(): void {
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(this.mapUserData(response)));
      },
    });
  }

  loading(): void {
    this.loadingDialog = this.dialog.open(LoadingComponent, {
      height: '200px',
      disableClose: true,
      autoFocus: false,
    });
  }

  checkEditable(user: User): boolean {
    const parentUser = this.route.parent?.parent?.snapshot.data['user'];
    if (!parentUser) return false;
    
    if (parentUser.id === user.id) return false;
    return !user.module?.pivot?.is_editable;
  }

  checkPermissions(name: string): boolean {
    const roles = this.route.parent?.parent?.snapshot.data['user']?.roles || [];
    // 🌟 Otimização com .some(): para o loop no primeiro match encontrado
    return !roles.some((role: any) => 
      role.permissions?.some((permission: Permission) => permission.name === name)
    );
  }

  // ==========================================
  // 🌟 AÇÕES DO USUÁRIO (DESCOMENTADAS E ALINHADAS)
  // ==========================================

  private openModalAndListen(component: any, user: User, width: string = '400px', syncChannel: boolean = true): void {
    this.dialog.open(component, {
      width,
      disableClose: true,
      autoFocus: false,
      data: { user }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.upgradeUsers();
        if (syncChannel) {
          TRANSPLANTE_USERS_CHANNEL.postMessage('update'); // 🌟 CORREÇÃO: Enviando para o canal do Transplante
        }
      }
    });
  }

  lockUser(user: User): void {
    // Quando criar o componente, descomente a linha abaixo:
    // this.openModalAndListen(LockUserComponent, user);
  }

  validateUser(user: User): void {
    // Quando criar o componente, descomente a linha abaixo:
    // this.openModalAndListen(ValidateUserComponent, user);
  }

  showUser(user: User): void {
    // ShowUser não precisa recarregar a listagem (não altera dados)
    // Quando criar o componente, descomente a linha abaixo:
    // this.dialog.open(ShowUserComponent, { width: '700px', disableClose: true, autoFocus: false, data: { user } });
  }

  rolesUser(user: User): void {
    // Quando criar o componente, descomente a linha abaixo:
    this.openModalAndListen(RolesUserComponent, user);
  }

  updateUser(user: User): void {
    // Quando criar o componente, descomente a linha abaixo:
    // this.openModalAndListen(UpdateUserComponent, user, '700px');
  }

  deleteUser(user: User): void {
    // Quando criar o componente, descomente a linha abaixo:
    // this.openModalAndListen(DeleteUserComponent, user);
  }
}