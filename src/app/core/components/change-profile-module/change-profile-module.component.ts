import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Core & Services & Enums
import { AvaliableModules } from '../../enums/avaliable-modules';
import { MessageService } from '../../services/message-service';
import { ProfileService } from '../../services/profile-service';

export interface UserModule {
  id: number;
  name: string;
}

@Component({
  selector: 'app-change-profile-module',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './change-profile-module.component.html',
  styleUrl: './change-profile-module.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangeProfileModuleComponent implements OnInit {
  // ==========================================
  // Injeção de Dependências
  // ==========================================
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly profileService = inject(ProfileService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<ChangeProfileModuleComponent>);
  private readonly destroyRef = inject(DestroyRef);

  // ==========================================
  // Propriedades e Estado Reativo
  // ==========================================
  protected readonly filteredModules = signal<UserModule[]>([]);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly selectedModuleId = signal<number | null>(null);

  // ==========================================
  // Ciclo de Vida (Hooks)
  // ==========================================
  ngOnInit(): void {
    this.loadFilteredModules();
  }

  // ==========================================
  // Métodos Acessíveis pelo Template (Protected)
  // ==========================================
  protected changeProfileModule(moduleId: number): void {
    if (this.isSubmitting() || this.checkModule(moduleId)) {
      return;
    }

    this.isSubmitting.set(true);
    this.selectedModuleId.set(moduleId);

    this.profileService.changeProfileModule(moduleId)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.selectedModuleId.set(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.dialogRef.close(true);
          window.location.href = 'principal';
        },
        error: (err) => {
          const fallbackError = 'Erro ao alterar o módulo do usuário.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }

  protected checkModule(moduleId: number): boolean {
    return this.data?.user?.module_id === moduleId;
  }

  // ==========================================
  // Métodos Privados
  // ==========================================
  private loadFilteredModules(): void {
    const validModules: UserModule[] = this.data?.user?.valid_modules ?? [];
    const systemModules = Object.values(AvaliableModules) as string[];

    const filtered = validModules.filter((mod: UserModule) =>
      systemModules.includes(mod.name)
    );

    this.filteredModules.set(filtered);
  }
}