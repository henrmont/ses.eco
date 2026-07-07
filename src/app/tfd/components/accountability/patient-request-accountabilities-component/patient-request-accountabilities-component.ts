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

// Models e Serviços do Contexto de Prestações de Contas
import { Accountability } from '../../../models/accountability';
import { Permission } from '../../../models/permission';
import { AccountabilityService } from '../../../services/accountability-service';

// Modais do Contexto de Prestações de Contas
import { CreateAccountabilityComponent } from '../create-accountability-component/create-accountability-component';
import { UpdateAccountabilityComponent } from '../update-accountability-component/update-accountability-component';
import { DeleteAccountabilityComponent } from '../delete-accountability-component/delete-accountability-component';
import { AccountabilityDailiesComponent } from '../accountability-dailies-component/accountability-dailies-component';
import { ShowAccountabilityComponent } from '../show-accountability-component/show-accountability-component';

@Component({
  selector: 'app-patient-request-accountabilities-component',
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
  templateUrl: './patient-request-accountabilities-component.html',
  styleUrl: './patient-request-accountabilities-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima unindo OnPush + Signals + Computed
})
export class PatientRequestAccountabilitiesComponent implements OnInit {
  // Injeções de dependência modernas via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly accountabilityService = inject(AccountabilityService);
  private readonly destroyRef = inject(DestroyRef);

  // Propriedades expostas para o Template com computed e signals
  protected readonly displayedColumns: string[] = ['name', 'created_at', 'dailies', 'actions'];
  protected readonly accountabilitiesList = signal<Accountability[]>([]);
  protected readonly dataSource = computed(() => new MatTableDataSource(this.accountabilitiesList()));
  protected readonly isLoading = signal<boolean>(true);
  protected readonly totalValue = signal<number>(0);

  ngOnInit(): void {
    this.refreshData(true);
  }

  /**
   * Dispara a atualização síncrona da listagem e do saldo do atendimento
   */
  private refreshData(showLoading = false): void {
    this.fetchAccountabilities(showLoading);
    this.fetchBalance();
  }

  /**
   * Busca as prestações de contas de forma reativa, performática e segura.
   */
  private fetchAccountabilities(showLoading = false): void {
    const requestId = this.data?.patient_request?.id;

    if (!requestId) {
      this.isLoading.set(false);
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.accountabilityService.getAccountabilities(requestId)
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
          this.accountabilitiesList.set(response);
        },
        error: () => {
          // Evita estouro de exceções soltas na aplicação e nos testes
        }
      });
  }

  /**
   * Obtém o saldo (balanço) atualizado baseado no atendimento do paciente
   */
  private fetchBalance(): void {
    const careId = this.data?.patient_request?.report?.patient_care?.id;
    if (!careId) return;

    this.accountabilityService.getBalance(careId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.totalValue.set(response);
        },
        error: () => {}
      });
  }

  /**
   * Centraliza a abertura de modais com tratamento automático reativo pós-fechamento
   */
  private openDialog(
    component: any, 
    data: any, 
    options: { width?: string; refreshWithLoading?: boolean; updateBalance?: boolean } = {}
  ): void {
    this.dialog.open(component, {
      width: options.width || '800px',
      disableClose: true,
      autoFocus: false,
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        // Se a modal retornar true ou se for a modal de diárias (que atualiza dados independentemente do confirm)
        if (result || options.updateBalance) {
          this.refreshData(options.refreshWithLoading || false);
        }
      });
  }

  /**
   * Verifica se a permissão informada NÃO existe nos papéis recebidos.
   */
  protected checkPermissions(name: string): boolean {
    const roles = this.data?.permissions || [];
    for (const item of roles) {
      const hasPermission = item.permissions?.some((p: Permission) => p.name === name);
      if (hasPermission) {
        return false;
      }
    }
    return true;
  }

  // Métodos de ação disparados pelo template HTML (Modificadores Protected)
  protected createAccountability(): void {
    this.openDialog(CreateAccountabilityComponent, 
      { patient_request: this.data.patient_request },
      { width: '400px', refreshWithLoading: true }
    );
  }

  protected showAccountability(accountability: Accountability): void {
    this.openDialog(ShowAccountabilityComponent, { accountability });
  }

  protected updateAccountability(accountability: Accountability): void {
    this.openDialog(UpdateAccountabilityComponent, { accountability }, { width: '500px', refreshWithLoading: true });
  }

  protected deleteAccountability(accountability: Accountability): void {
    this.openDialog(DeleteAccountabilityComponent, { accountability }, { width: '400px', refreshWithLoading: true });
  }

  protected accountabilityDailies(accountability: Accountability): void {
    this.openDialog(AccountabilityDailiesComponent, 
      { accountability, permissions: this.data?.permissions }, 
      { width: '1000px', refreshWithLoading: true, updateBalance: true }
    );
  }
}