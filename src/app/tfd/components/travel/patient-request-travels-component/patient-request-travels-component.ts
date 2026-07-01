import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DatePipe } from '@angular/common';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

// Models e Serviços do Contexto de Viagens
import { Travel } from '../../../models/travel';
import { Permission } from '../../../models/permission';
import { TravelService } from '../../../services/travel-service';

// Modais do Contexto de Viagens
import { CreateTravelComponent } from '../create-travel-component/create-travel-component';
import { ShowTravelComponent } from '../show-travel-component/show-travel-component';
import { UpdateTravelComponent } from '../update-travel-component/update-travel-component';
import { DeleteTravelComponent } from '../delete-travel-component/delete-travel-component';
import { TravelPassengersComponent } from '../travel-passengers-component/travel-passengers-component';
import { TravelRoutesComponent } from '../travel-routes-component/travel-routes-component';

@Component({
  selector: 'app-patient-request-travels-component',
  standalone: true,
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './patient-request-travels-component.html',
  styleUrl: './patient-request-travels-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima unindo OnPush + Signals + Computed
})
export class PatientRequestTravelsComponent implements OnInit {
  // Injeções de dependência modernas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly travelService = inject(TravelService);
  private readonly destroyRef = inject(DestroyRef);

  // Propriedades expostas para o Template com computed e signals
  protected readonly displayedColumns: string[] = ['os', 'origin', 'destination', 'departure_date', 'actions'];
  protected readonly travelsList = signal<Travel[]>([]);
  protected readonly dataSource = computed(() => new MatTableDataSource(this.travelsList()));
  protected readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchTravels(true);
  }

  /**
   * Busca as viagens da solicitação de forma reativa, performática e segura.
   */
  private fetchTravels(showLoading = false): void {
    const requestId = this.data?.patient_request?.id;

    if (!requestId) {
      this.isLoading.set(false);
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.travelService.getTravels(requestId)
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
          this.travelsList.set(response);
        },
        error: () => {
          // Trata o erro de conexão impedindo exceções soltas na aplicação e nos testes
        }
      });
  }

  /**
   * Centraliza a abertura de modais com tratamento automático do após fechamento de forma reativa
   */
  private openDialog(
    component: any, 
    data: any, 
    options: { width?: string; height?: string; refreshWithLoading?: boolean } = {}
  ): void {
    this.dialog.open(component, {
      width: options.width || '800px',
      height: options.height || '700px',
      disableClose: true,
      autoFocus: false,
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.fetchTravels(options.refreshWithLoading || false);
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
  protected createTravel(): void {
    this.openDialog(CreateTravelComponent, 
      { patient_request: this.data.patient_request },
      { height: 'auto', refreshWithLoading: true }
    );
  }

  protected showTravel(travel: Travel): void {
    this.openDialog(ShowTravelComponent, { travel }, { height: 'auto' });
  }

  protected updateTravel(travel: Travel): void {
    this.openDialog(UpdateTravelComponent, { travel }, { height: 'auto', refreshWithLoading: true });
  }

  protected deleteTravel(travel: Travel): void {
    this.openDialog(DeleteTravelComponent, { travel }, { width: '400px', height: 'auto', refreshWithLoading: true });
  }

  protected passengers(travel: Travel): void {
    this.openDialog(TravelPassengersComponent, { travel }, { width: '1200px', height: 'auto' });
  }

  protected routes(travel: Travel): void {
    this.openDialog(TravelRoutesComponent, { travel }, { height: 'auto' });
  }
}