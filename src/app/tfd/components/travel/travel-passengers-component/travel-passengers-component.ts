import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CommonModule, CurrencyPipe, PercentPipe } from '@angular/common';
import { Overlay } from '@angular/cdk/overlay';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

// Models e Serviços
import { Passenger } from '../../../models/passenger';
import { TravelService } from '../../../services/travel-service';
import { MessageService } from '../../../../core/services/message-service';

// Modais do Contexto de Passageiros
import { CreatePassengerComponent } from '../create-passenger-component/create-passenger-component';
import { UpdatePassengerComponent } from '../update-passenger-component/update-passenger-component';
import { DeletePassengerComponent } from '../delete-passenger-component/delete-passenger-component';
import { ShowPassengerComponent } from '../show-passenger-component/show-passenger-component';

const TFD_TRAVELS_CHANNEL = new BroadcastChannel('tfd-travels-channel');

@Component({
  selector: 'app-travel-passengers-component',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    PercentPipe,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './travel-passengers-component.html',
  styleUrl: './travel-passengers-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TravelPassengersComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly travelService = inject(TravelService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  // Colunas e Coleções
  protected readonly displayedColumns: string[] = ['passenger', 'is_patient', 'tariff', 'tax', 'discount', 'total', 'actions'];
  protected readonly passengersList = signal<Passenger[]>([]);
  protected readonly isLoading = signal<boolean>(true);

  // Mapeia a lista calculando o valor total individual: (Tarifa + Taxa) - Desconto%
  private readonly mappedPassengers = computed(() => 
    this.passengersList().map(item => {
      const tariff = Number(item.tariff) || 0;
      const tax = Number(item.tax) || 0;
      const discountPercent = Number(item.discount) || 0;

      const baseAmount = tariff + tax;
      const discountAmount = baseAmount * (discountPercent / 100);
      const total = baseAmount - discountAmount;

      return {
        ...item,
        total
      };
    })
  );

  // Fonte de dados reativa vinculada diretamente ao computed anterior
  protected readonly dataSource = computed(() => new MatTableDataSource(this.mappedPassengers()));

  // Calcula o valor total global
  protected readonly totalValue = computed(() => 
    this.mappedPassengers().reduce((acc, item) => acc + item.total, 0)
  );

  ngOnInit(): void {
    this.fetchPassengers(true);
  }

  /**
   * Busca os passageiros vinculados à viagem de forma reativa.
   */
  private fetchPassengers(showLoading: boolean = false): void {
    const travelId = this.data?.travel?.id;

    if (!travelId) {
      this.isLoading.set(false);
      this.cdr.markForCheck();
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.travelService.getPassengers(travelId)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.passengersList.set(response || []);
        },
        error: (err) => {
          this.passengersList.set([]);
          const fallbackError = 'Não foi possível carregar os passageiros da viagem.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }

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
          this.fetchPassengers(requiresRefresh || false);
          
          if (emitGlobalBroadcast) {
            TFD_TRAVELS_CHANNEL.postMessage('update');
          }
          this.cdr.markForCheck();
        }
      });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE ---

  protected createPassenger(): void {
    this.openDialog(CreatePassengerComponent, { travel: this.data?.travel }, '800px');
  }

  protected showPassenger(passenger: Passenger): void {
    this.openDialog(ShowPassengerComponent, { passenger }, '800px', 'auto', false, false);
  }

  protected updatePassenger(passenger: Passenger): void {
    this.openDialog(UpdatePassengerComponent, { passenger }, '800px');
  }

  protected deletePassenger(passenger: Passenger): void {
    this.openDialog(DeletePassengerComponent, { passenger }, '400px', 'auto', true);
  }
}