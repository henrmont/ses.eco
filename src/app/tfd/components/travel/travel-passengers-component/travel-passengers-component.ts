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
import { Passenger } from '../../../models/passenger';
import { TravelService } from '../../../services/travel-service';

// Modais do Contexto de Passageiros
import { CreatePassengerComponent } from '../create-passenger-component/create-passenger-component';
import { UpdatePassengerComponent } from '../update-passenger-component/update-passenger-component';
import { DeletePassengerComponent } from '../delete-passenger-component/delete-passenger-component';

@Component({
  selector: 'app-travel-passengers-component',
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
  templateUrl: './travel-passengers-component.html',
  styleUrl: './travel-passengers-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima unindo OnPush + Signals + Computed
})
export class TravelPassengersComponent implements OnInit {
  // Injeções de dependência modernas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly travelService = inject(TravelService);
  private readonly destroyRef = inject(DestroyRef);

  // Propriedades expostas para o Template com computed e signals
  protected readonly displayedColumns: string[] = ['passenger', 'is_patient', 'tariff', 'tax', 'total', 'actions'];
  protected readonly passengersList = signal<any[]>([]);
  protected readonly isLoading = signal<boolean>(true);

  // Mapeia a lista adicionando o valor computado 'total' individual de forma reativa
  private readonly mappedPassengers = computed(() => 
    this.passengersList().map(item => ({
      ...item,
      total: (Number(item.tariff) || 0) + (Number(item.tax) || 0)
    }))
  );

  // Fonte de dados reativa vinculada diretamente ao computed anterior
  protected readonly dataSource = computed(() => new MatTableDataSource(this.mappedPassengers()));

  // Calcula o valor total global de tarifas + taxas somando todo o array de maneira limpa
  protected readonly totalValue = computed(() => 
    this.mappedPassengers().reduce((acc, item) => acc + item.total, 0)
  );

  ngOnInit(): void {
    this.fetchPassengers(true);
  }

  /**
   * Busca os passageiros vinculados à viagem de forma reativa e segura.
   */
  private fetchPassengers(showLoading = false): void {
    const travelId = this.data?.travel?.id;

    if (!travelId) {
      this.isLoading.set(false);
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.travelService.getPassengers(travelId)
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
          this.passengersList.set(response || []);
        },
        error: () => {
          // Trata falhas de rede de forma silenciosa e limpa
        }
      });
  }

  /**
   * Centraliza a abertura das modais internas de passageiro com atualização do estado pós-fechamento
   */
  private openDialog(
    component: any, 
    data: any, 
    options: { width?: string; refreshWithLoading?: boolean } = {}
  ): void {
    this.dialog.open(component, {
      width: options.width || '600px',
      disableClose: true,
      autoFocus: false,
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.fetchPassengers(options.refreshWithLoading || false);
        }
      });
  }

  // Métodos de ação disparados pelo template HTML (Modificadores Protected)
  protected createPassenger(): void {
    this.openDialog(CreatePassengerComponent, 
      { travel: this.data.travel }, 
      { refreshWithLoading: true }
    );
  }

  protected updatePassenger(passenger: Passenger): void {
    this.openDialog(UpdatePassengerComponent, 
      { passenger }, 
      { refreshWithLoading: true }
    );
  }

  protected deletePassenger(passenger: Passenger): void {
    this.openDialog(DeletePassengerComponent, 
      { passenger }, 
      { width: '400px', refreshWithLoading: true }
    );
  }
}