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
import { Route } from '../../../models/route';
import { TravelService } from '../../../services/travel-service';

// Modais do Contexto de Rotas
import { CreateRouteComponent } from '../create-route-component/create-route-component';
import { UpdateRouteComponent } from '../update-route-component/update-route-component';
import { DeleteRouteComponent } from '../delete-route-component/delete-route-component';

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
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima unindo OnPush + Signals + Computed
})
export class TravelRoutesComponent implements OnInit {
  // Injeções de dependência modernas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly travelService = inject(TravelService);
  private readonly destroyRef = inject(DestroyRef);

  // Propriedades expostas para o Template com computed e signals
  protected readonly displayedColumns: string[] = ['origin', 'destination', 'distance', 'actions'];
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
   * Busca as rotas vinculadas à viagem de forma reativa e segura.
   */
  private fetchRoutes(showLoading = false): void {
    const travelId = this.data?.travel?.id;

    if (!travelId) {
      this.isLoading.set(false);
      return;
    }

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.travelService.getRoutes(travelId)
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
          this.routesList.set(response || []);
        },
        error: () => {
          // Trata falhas de rede de forma silenciosa e limpa
        }
      });
  }

  /**
   * Centraliza a abertura das modais internas de rota com atualização do estado pós-fechamento
   */
  private openDialog(
    component: any, 
    data: any, 
    options: { width?: string; refreshWithLoading?: boolean } = {}
  ): void {
    this.dialog.open(component, {
      width: options.width || '400px',
      disableClose: true,
      autoFocus: false,
      data
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.fetchRoutes(options.refreshWithLoading || false);
        }
      });
  }

  // Métodos de ação disparados pelo template HTML (Modificadores Protected)
  protected createRoute(): void {
    this.openDialog(CreateRouteComponent, 
      { travel: this.data.travel }, 
      { refreshWithLoading: true }
    );
  }

  protected updateRoute(route: Route): void {
    this.openDialog(UpdateRouteComponent, 
      { route }, 
      { refreshWithLoading: true }
    );
  }

  protected deleteRoute(route: Route): void {
    this.openDialog(DeleteRouteComponent, 
      { route }, 
      { refreshWithLoading: true }
    );
  }
}