import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Overlay } from '@angular/cdk/overlay';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

// Models e Serviços
import { Route } from '../../../models/route';
import { TravelService } from '../../../services/travel-service';
import { MessageService } from '../../../../core/services/message-service';

// Modais do Contexto de Rotas
import { CreateRouteComponent } from '../create-route-component/create-route-component';
import { UpdateRouteComponent } from '../update-route-component/update-route-component';
import { DeleteRouteComponent } from '../delete-route-component/delete-route-component';
import { ShowRouteComponent } from '../show-route-component/show-route-component';

const TFD_TRAVELS_CHANNEL = new BroadcastChannel('tfd-travels-channel');

@Component({
  selector: 'app-travel-routes-component',
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
  templateUrl: './travel-routes-component.html',
  styleUrl: './travel-routes-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TravelRoutesComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly overlay = inject(Overlay);
  private readonly travelService = inject(TravelService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  // Colunas e Coleções
  protected readonly displayedColumns: string[] = ['route', 'departure', 'arrival', 'distance', 'actions'];
  protected readonly routesList = signal<Route[]>([]);
  protected readonly isLoading = signal<boolean>(true);

  // Fonte de dados reativa vinculada diretamente à lista base via Computed
  protected readonly dataSource = computed(() => new MatTableDataSource<Route>(this.routesList()));

  // Calcula a distância total global somando de maneira limpa e automática sempre que a lista mudar
  protected readonly totalDistance = computed(() => 
    this.routesList().reduce((acc, item) => acc + (Number(item.distance) || 0), 0)
  );

  ngOnInit(): void {
    this.fetchRoutes(true);
  }

  /**
   * Busca as rotas vinculadas à viagem de forma reativa.
   */
  private fetchRoutes(showLoading: boolean = false): void {
    const travelId = this.data?.travel?.id;

    if (!travelId) {
      this.isLoading.set(false);
      this.cdr.markForCheck();
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.travelService.getRoutes(travelId)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.routesList.set(response || []);
        },
        error: (err) => {
          this.routesList.set([]);
          const fallbackError = 'Não foi possível carregar as rotas da viagem.';
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
          this.fetchRoutes(requiresRefresh || false);
          
          if (emitGlobalBroadcast) {
            TFD_TRAVELS_CHANNEL.postMessage('update');
          }
          this.cdr.markForCheck();
        }
      });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE ---

  protected createRoute(): void {
    this.openDialog(CreateRouteComponent, { travel: this.data?.travel }, '800px');
  }

  protected showRoute(route: Route): void {
    this.openDialog(ShowRouteComponent, { route }, '800px', 'auto', false, false);
  }

  protected updateRoute(route: Route): void {
    this.openDialog(UpdateRouteComponent, { route }, '800px');
  }

  protected deleteRoute(route: Route): void {
    this.openDialog(DeleteRouteComponent, { route }, '400px', 'auto', true);
  }
}