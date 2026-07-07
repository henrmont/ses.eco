import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

// Models e Serviços
import { AccountabilityDaily } from '../../../models/accountability-daily';
import { AccountabilityService } from '../../../services/accountability-service';
import { Permission } from '../../../models/permission';

// Modais do Contexto de Diárias da Prestação de Contas
import { CreateAccountabilityDailyComponent } from '../create-accountability-daily-component/create-accountability-daily-component';
import { UpdateAccountabilityDailyComponent } from '../update-accountability-daily-component/update-accountability-daily-component';
import { DeleteAccountabilityDailyComponent } from '../delete-accountability-daily-component/delete-accountability-daily-component';

@Component({
  selector: 'app-accountability-dailies-component',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './accountability-dailies-component.html',
  styleUrl: './accountability-dailies-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima unindo OnPush + Signals + Computed
})
export class AccountabilityDailiesComponent implements OnInit {
  // Injeções de dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly accountabilityService = inject(AccountabilityService);
  private readonly destroyRef = inject(DestroyRef);

  // Propriedades expostas para o Template com computed e signals
  protected readonly displayedColumns: string[] = ['name', 'value', 'amount', 'partial', 'actions'];
  protected readonly dailiesList = signal<any[]>([]);
  protected readonly isLoading = signal<boolean>(true);

  // Mapeia a lista adicionando o valor computado 'partial' (subtotal) individual de forma reativa
  private readonly mappedDailies = computed(() => 
    this.dailiesList().map(item => ({
      ...item,
      partial: (Number(item.amount) || 0) * (Number(item.daily_cost?.value) || 0)
    }))
  );

  // Fonte de dados reativa vinculada diretamente ao computed anterior para alimentar a MatTable
  protected readonly dataSource = computed(() => new MatTableDataSource<AccountabilityDaily>(this.mappedDailies()));

  // Calcula o valor total global somando todos os parciais de maneira limpa e reativa
  protected readonly totalValue = computed(() => 
    this.mappedDailies().reduce((acc, item) => acc + item.partial, 0)
  );

  ngOnInit(): void {
    this.fetchAccountabilityDailies(true);
  }

  /**
   * Busca as diárias vinculadas à prestação de contas de forma reativa e segura.
   */
  private fetchAccountabilityDailies(showLoading = false): void {
    const accountabilityId = this.data?.accountability?.id;

    if (!accountabilityId) {
      this.isLoading.set(false);
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.accountabilityService.getAccountabilityDailies(accountabilityId)
      .pipe(
        finalize(() => {
          if (showLoading) {
            this.isLoading.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.dailiesList.set(response || []);
        },
        error: () => {
          // Trata falhas de rede de forma silenciosa e limpa
        }
      });
  }

  /**
   * Centraliza a abertura das modais internas de diárias com atualização do estado pós-fechamento
   */
  private openDialog(
    component: any, 
    data: any, 
    options: { width?: string; refreshWithLoading?: boolean } = {}
  ): void {
    this.dialog.open(component, {
      width: options.width || '500px',
      disableClose: true,
      autoFocus: false,
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.fetchAccountabilityDailies(options.refreshWithLoading || false);
        }
      });
  }

  /**
   * Varredura performática na árvore de permissões injetada
   */
  protected checkPermissions(name: string): boolean {
    const roles: Permission[] = this.data?.permissions ?? [];
    return !roles.some((role: any) => 
      role.permissions?.some((permission: Permission) => permission.name === name)
    );
  }

  // Métodos de ação disparados pelo template HTML (Modificadores Protected)
  protected createAccountabilityDaily(): void {
    this.openDialog(CreateAccountabilityDailyComponent, 
      { accountability: this.data.accountability }, 
      { refreshWithLoading: true }
    );
  }

  protected updateAccountabilityDaily(accountability_daily: AccountabilityDaily): void {
    this.openDialog(UpdateAccountabilityDailyComponent, 
      { accountability_daily }, 
      { refreshWithLoading: true }
    );
  }

  protected deleteAccountabilityDaily(accountability_daily: AccountabilityDaily): void {
    this.openDialog(DeleteAccountabilityDailyComponent, 
      { accountability_daily }, 
      { width: '400px', refreshWithLoading: true }
    );
  }
}