import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth-service';
import { User } from '../../models/user';
import { ChangeProfileModuleComponent } from '../../components/change-profile-module-component/change-profile-module-component';
import { ChangeProfileImageComponent } from '../../components/change-profile-image-component/change-profile-image-component';
import { ChangeProfileInfoComponent } from '../../components/change-profile-info-component/change-profile-info-component';
import { CommonModule } from '@angular/common';

// 1. Importação do Enum de módulos
import { AvaliableModules } from '../../enums/avaliable-modules'; // Ajuste o caminho de importação do seu Enum

// Define o tipo para aceitar apenas as chaves do Enum ou undefined/null
export type ModuleKey = keyof typeof AvaliableModules;

@Component({
  selector: 'app-core-layout',
  imports: [
    CommonModule, 
    RouterModule, 
    MatSidenavModule, 
    MatListModule, 
    MatIconModule, 
    MatToolbarModule, 
    MatMenuModule, 
    MatButtonModule
  ],
  templateUrl: './core.layout.html',
  styleUrl: './core.layout.scss',
})
export class CoreLayout implements OnInit {

  user = signal<User>({} as User);
  
  // O sinal agora guarda o VALOR do enum
  module = signal<string | undefined>(undefined);

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    const userData = this.route.snapshot.data['user'];
    this.user.set(userData);

    if (userData?.module) {
      const moduleValue = this.getModuleValue(userData.module);
      this.module.set(moduleValue);
    }
  }

  /**
   * Retorna a CHAVE do Enum correspondente ao valor do sinal
   * Exemplo: 'licitacao' -> 'LICITAÇÃO'
   */
  get moduleKey(): string | undefined {
    const val = this.module();
    if (!val) return undefined;

    const entry = Object.entries(AvaliableModules).find(
      ([_, enumValue]) => String(enumValue).toLowerCase() === val.toLowerCase()
    );

    return entry ? entry[0] : val.toUpperCase();
  }

  /**
   * Extrai o valor do módulo enviado da API
   */
  private getModuleValue(rawValue: unknown): string | undefined {
    if (!rawValue) return undefined;

    if (typeof rawValue === 'object' && rawValue !== null) {
      const obj = rawValue as Record<string, unknown>;
      return String(obj['name'] || obj['code'] || obj['slug'] || obj['value'] || '');
    }

    return String(rawValue);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        window.localStorage.clear();
      },
      complete: () => {
        window.location.reload();
      }
    });
  }

  changeProfileModule() {
    this.dialog.open(ChangeProfileModuleComponent, {
      disableClose: true,
      autoFocus: false,
      data: {
        user: this.user(),
      }
    });
  }

  openAboutBox() {}

  onFileSelected(event: any) {
    this.changeProfileImage(event);
  }

  changeProfileImage(event: any) {
    this.dialog.open(ChangeProfileImageComponent, {
      disableClose: true,
      autoFocus: false,
      data: {
        user: this.user(),
        event: event
      }
    }).afterClosed().subscribe(result => {
      this.user.update(user => ({
        ...user,
        image: result ? result.value : user.image
      }));
    });
  }

  changeProfileInfo() {
    this.dialog.open(ChangeProfileInfoComponent, {
      disableClose: true,
      autoFocus: false,
      width: '400px',
      data: {
        user: this.user(),
      }
    }).afterClosed().subscribe(result => {
      this.user.update(user => ({
        ...user,
        name: result ? result.value : user.name
      }));
    });
  }
}