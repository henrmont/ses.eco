import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, ChangeDetectorRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Overlay } from '@angular/cdk/overlay';

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
import { MessageService } from '../../../../core/services/message-service';

// Modais do Contexto de Prestações de Contas
import { CreateAccountabilityComponent } from '../create-accountability-component/create-accountability-component';
import { UpdateAccountabilityComponent } from '../update-accountability-component/update-accountability-component';
import { DeleteAccountabilityComponent } from '../delete-accountability-component/delete-accountability-component';
import { AccountabilityDailiesComponent } from '../accountability-dailies-component/accountability-dailies-component';
import { ShowAccountabilityComponent } from '../show-accountability-component/show-accountability-component';

const TFD_PATIENT_REQUESTS_CHANNEL = new BroadcastChannel('tfd-patient-requests-channel');

@Component({
  selector: 'app-patient-request-accountabilities-component',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './patient-request-accountabilities-component.html',
  styleUrl: './patient-request-accountabilities-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientRequestAccountabilitiesComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly accountabilityService = inject(AccountabilityService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  // Colunas e Coleções
  protected readonly displayedColumns: string[] = ['name', 'created_at', 'dailies', 'actions'];
  protected readonly accountabilitiesList = signal<Accountability[]>([]);
  protected readonly dataSource = computed(() => new MatTableDataSource(this.accountabilitiesList()));

  // Computado que define se o rodapé deve exibir as colunas ou ficar escondido quando a lista estiver vazia
  protected readonly footerColumns = computed(() => 
    this.accountabilitiesList().length > 0 ? this.displayedColumns : []
  );

  // Estados Reativos via Signals
  protected readonly isLoading = signal<boolean>(true);
  protected readonly totalValue = signal<number>(0); // Saldo vindo do backend

  // Somatório computado do montante total de diárias das prestações de contas da tabela
  protected readonly totalAccountabilities = computed(() =>
    this.accountabilitiesList().reduce((acc, item) => acc + (Number(item.total_dailies) || 0), 0)
  );

  /**
   * Avalia dinamicamente se existe alguma prestação de contas cadastrada que ainda não possui diárias lançadas
   */
  protected readonly hasAccountabilityWithoutDailies = computed(() => {
    const list = this.accountabilitiesList();
    if (!list || list.length === 0) return false;

    return list.some(item => {
      const totalDailies = Number(item.total_dailies) || 0;
      const dailiesArrayLength = Array.isArray(item.dailies) ? item.dailies.length : 0;
      return totalDailies === 0 && dailiesArrayLength === 0;
    });
  });

  ngOnInit(): void {
    this.refreshData(true);
  }

  // --- BUSCA E REFRESH DE DADOS ---

  /**
   * Dispara a atualização síncrona da listagem e do saldo
   */
  private refreshData(showLoading: boolean = false): void {
    this.fetchAccountabilities(showLoading);
    this.fetchBalance();
  }

  /**
   * Busca as prestações de contas cadastradas para a solicitação do paciente
   */
  private fetchAccountabilities(showLoading: boolean = false): void {
    const requestId = this.data?.patient_request?.id;

    if (!requestId) {
      this.isLoading.set(false);
      this.cdr.markForCheck();
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.accountabilityService.getAccountabilities(requestId)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          const items = Array.isArray(response) ? response : (response?.data || []);
          this.accountabilitiesList.set(items);
        },
        error: (err) => {
          this.accountabilitiesList.set([]);
          const fallbackError = 'Não foi possível carregar as prestações de contas.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }

  /**
   * Obtém o saldo acumulado calculado pelo backend com tratamento seguro de ID
   */
  private fetchBalance(): void {
    const patientRequest = this.data?.patient_request;
    const careId = patientRequest?.report?.patient_care?.id 
      || patientRequest?.patient_care_id 
      || patientRequest?.id;

    if (!careId) return;

    this.accountabilityService.getBalance(careId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const balanceValue = typeof response === 'number'
            ? response
            : (response?.balance ?? response?.total ?? response?.value ?? 0);

          this.totalValue.set(Number(balanceValue) || 0);
          this.cdr.markForCheck();
        },
        error: () => {
          this.totalValue.set(0);
          this.cdr.markForCheck();
        }
      });
  }

  // --- GERENCIAMENTO DE MODAIS E PERMISSÕES ---

  /**
   * Centraliza a abertura de modais com tratamento automático do pós-fechamento
   */
  private openDialog(
    component: any, 
    data: any, 
    width: string = '800px', 
    height: string = 'auto', 
    requiresRefresh: boolean = true, 
    emitGlobalBroadcast: boolean = true
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
      .subscribe((result) => {
        if (result) {
          if (requiresRefresh) {
            this.refreshData(false);
          }
          
          if (emitGlobalBroadcast) {
            TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update');
          }
          this.cdr.markForCheck();
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

  // --- MÉTODOS DE AÇÃO DO TEMPLATE ---

  protected createAccountability(): void {
    this.openDialog(CreateAccountabilityComponent, 
      { patient_request: this.data?.patient_request },
      '500px'
    );
  }

  protected showAccountability(accountability: Accountability): void {
    this.openDialog(ShowAccountabilityComponent, { accountability }, '800px', 'auto', false, false);
  }

  protected updateAccountability(accountability: Accountability): void {
    this.openDialog(UpdateAccountabilityComponent, { accountability }, '400px');
  }

  protected deleteAccountability(accountability: Accountability): void {
    this.openDialog(DeleteAccountabilityComponent, { accountability }, '400px', 'auto', true);
  }

  protected accountabilityDailies(accountability: Accountability): void {
    this.openDialog(AccountabilityDailiesComponent, 
      { accountability, permissions: this.data?.permissions }, 
      '1000px', 'auto', true
    );
  }
}