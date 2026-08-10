import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DatePipe } from '@angular/common';
import { Overlay } from '@angular/cdk/overlay';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

// Models e Serviços
import { Travel } from '../../../models/travel';
import { TravelService } from '../../../services/travel-service';
import { MessageService } from '../../../../core/services/message-service';
import { AirlineCompany } from '../../../enums/airline-company';

// Modais do Contexto de Viagens
import { CreateTravelComponent } from '../create-travel-component/create-travel-component';
import { ShowTravelComponent } from '../show-travel-component/show-travel-component';
import { UpdateTravelComponent } from '../update-travel-component/update-travel-component';
import { DeleteTravelComponent } from '../delete-travel-component/delete-travel-component';
import { TravelPassengersComponent } from '../travel-passengers-component/travel-passengers-component';
import { TravelRoutesComponent } from '../travel-routes-component/travel-routes-component';

const TFD_TRAVELS_CHANNEL = new BroadcastChannel('tfd-travels-channel');

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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientRequestTravelsComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly travelService = inject(TravelService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  // Colunas da Tabela Atualizadas
  protected readonly displayedColumns: string[] = [
    'os', 
    'type', 
    'route',
    'company',
    'departure_date', 
    'return_date', 
    'status',
    'actions'
  ];
  
  protected readonly travelsList = signal<Travel[]>([]);
  protected readonly dataSource = computed(() => new MatTableDataSource<Travel>(this.travelsList()));
  protected readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchTravels(true);
  }

  /**
   * Converte a Key do Enum vinda do banco (ex: "LATAM") no seu Value de exibição (ex: "LATAM Airlines").
   */
  protected getAirlineCompanyLabel(key?: string): string {
    if (!key) return 'Não informada';
    return AirlineCompany[key as keyof typeof AirlineCompany] || key;
  }

  /**
   * Busca as viagens da solicitação de forma reativa e atualiza os signals.
   */
  private fetchTravels(showLoading: boolean = false): void {
    const requestId = this.data?.patient_request?.id;

    if (!requestId) {
      this.isLoading.set(false);
      this.cdr.markForCheck();
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.travelService.getTravels(requestId)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.travelsList.set(response || []);
        },
        error: (err) => {
          this.travelsList.set([]);
          const fallbackError = 'Não foi possível carregar as passagens da solicitação.';
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
          this.fetchTravels(requiresRefresh || false);
          
          if (emitGlobalBroadcast) {
            TFD_TRAVELS_CHANNEL.postMessage('update');
          }
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Avalia as permissões do usuário logado.
   * Retorna 'true' caso o usuário NÃO tenha acesso.
   */
  protected checkPermissions(permissionName: string): boolean {
    const roles = this.data?.permissions || [];
    return !roles.some((role: any) => 
      role?.permissions?.some((p: any) => p?.name === permissionName)
    );
  }

  // --- MÉTODOS DE AÇÃO ---

  protected createTravel(): void {
    this.openDialog(CreateTravelComponent, { patient_request: this.data?.patient_request }, '800px');
  }

  protected showTravel(travel: Travel): void {
    this.openDialog(ShowTravelComponent, { travel }, '1000px', 'auto', false, false);
  }

  protected updateTravel(travel: Travel): void {
    this.openDialog(UpdateTravelComponent, { travel }, '800px');
  }

  protected deleteTravel(travel: Travel): void {
    this.openDialog(DeleteTravelComponent, { travel }, '400px', 'auto', true);
  }

  protected passengers(travel: Travel): void {
    this.openDialog(TravelPassengersComponent, { travel }, '1200px', 'auto', false, false);
  }

  protected routes(travel: Travel): void {
    this.openDialog(TravelRoutesComponent, { travel }, '800px', 'auto', false, false);
  }
}