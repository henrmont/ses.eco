import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

// Core & Models
import { User } from '../../models/user';
import { AuthService } from '../../services/auth-service';
import { AvaliableModules } from '../../enums/avaliable-modules';

// Componentes Modais (Dialogs)
import { ChangeProfileImageComponent } from '../../components/change-profile-image/change-profile-image.component';
import { ChangeProfileInfoComponent } from '../../components/change-profile-info/change-profile-info.component';
import { ChangeProfileModuleComponent } from '../../components/change-profile-module/change-profile-module.component';

export type ModuleKey = keyof typeof AvaliableModules;

@Component({
  selector: 'app-core-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule
  ],
  templateUrl: './core.layout.html',
  styleUrl: './core.layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoreLayout implements OnInit {
  // ==========================================
  // Injeção de Dependências
  // ==========================================
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  // ==========================================
  // Propriedades e Estado Reativo
  // ==========================================
  protected readonly user = signal<User>({} as User);
  protected readonly module = signal<string | undefined>(undefined);

  // ==========================================
  // Ciclo de Vida (Hooks)
  // ==========================================
  ngOnInit(): void {
    const userData = this.route.snapshot.data['user'];
    if (userData) {
      this.user.set(userData);
    }

    if (userData?.module) {
      const moduleValue = this.getModuleValue(userData.module);
      this.module.set(moduleValue);
    }
  }

  // ==========================================
  // Getters & Propriedades Computadas
  // ==========================================

  /**
   * Retorna a CHAVE do Enum correspondente ao valor do sinal
   * Exemplo: 'licitacao' -> 'LICITAÇÃO'
   */
  protected get moduleKey(): string | undefined {
    const val = this.module();
    if (!val) return undefined;

    const entry = Object.entries(AvaliableModules).find(
      ([_, enumValue]) => String(enumValue).toLowerCase() === val.toLowerCase()
    );

    return entry ? entry[0] : val.toUpperCase();
  }

  // ==========================================
  // Métodos Acessíveis pelo Template (Protected)
  // ==========================================
  protected logout(): void {
    this.authService.logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          window.localStorage.clear();
        },
        complete: () => {
          window.location.reload();
        }
      });
  }

  protected changeProfileModule(): void {
    this.dialog.open(ChangeProfileModuleComponent, {
      width: '300px',
      disableClose: true,
      autoFocus: false,
      data: {
        user: this.user()
      }
    });
  }

  protected openAboutBox(): void {
    // Implementação futura do modal Sobre
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.changeProfileImage(event);
    }
  }

  protected changeProfileImage(event: Event): void {
    this.dialog.open(ChangeProfileImageComponent, {
      disableClose: true,
      autoFocus: false,
      data: {
        user: this.user(),
        event
      }
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((newImageBase64: string | undefined) => {
        if (newImageBase64) {
          // Atualiza o signal criando um novo objeto do usuário
          this.user.update(user => ({
            ...user,
            image: newImageBase64
          }));
        }
      });
  }

  protected changeProfileInfo(): void {
    this.dialog.open(ChangeProfileInfoComponent, {
      disableClose: true,
      autoFocus: false,
      width: '400px',
      data: {
        user: this.user()
      }
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result?.value) {
          this.user.update(user => ({
            ...user,
            name: result.value
          }));
        }
      });
  }

  // ==========================================
  // Métodos Privados
  // ==========================================
  private getModuleValue(rawValue: unknown): string | undefined {
    if (!rawValue) return undefined;

    if (typeof rawValue === 'object' && rawValue !== null) {
      const obj = rawValue as Record<string, unknown>;
      return String(obj['name'] || obj['code'] || obj['slug'] || obj['value'] || '');
    }

    return String(rawValue);
  }
}