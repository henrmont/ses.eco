import { ChangeDetectionStrategy, Component, DestroyRef, Injector, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';

// Core & Models
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { Permission } from '../../models/permission.model';
import { HospitalUnity } from '../../models/hospital-unity.model';

// Services & Dialogs
import { HospitalUnityService } from '../../services/hospital-unity-service';
import { UpdateHospitalUnityComponent } from '../../components/hospital-unities/update-hospital-unity-component/update-hospital-unity-component';
import { DeleteHospitalUnityComponent } from '../../components/hospital-unities/delete-hospital-unity-component/delete-hospital-unity-component';
import { ShowHospitalUnityComponent } from '../../components/hospital-unities/show-hospital-unity-component/show-hospital-unity-component';

const TFD_HOSPITAL_UNITIES_CHANNEL = new BroadcastChannel('tfd-hospital-unities-channel');

@Component({
  selector: 'app-hospital-unities-page',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatTooltipModule
  ],
  templateUrl: './hospital-unities-page.html',
  styleUrl: './hospital-unities-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HospitalUnitiesPage implements OnInit {
  // ==========================================
  // Injeção de Dependências
  // ==========================================
  private readonly hospitalUnityService = inject(HospitalUnityService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // ==========================================
  // Propriedades e Estado Reativo
  // ==========================================
  protected readonly displayedColumns: string[] = ['name', 'cnes', 'city', 'uf', 'actions'];
  protected readonly dataSource = signal<MatTableDataSource<HospitalUnity>>(new MatTableDataSource<HospitalUnity>());
  
  private loadingDialog!: MatDialogRef<LoadingComponent>;

  constructor() {
    TFD_HOSPITAL_UNITIES_CHANNEL.onmessage = (message) => {
      if (message.data === 'update') {
        this.upgradeHospitalUnities();
      }
    };
  }

  // ==========================================
  // Ciclo de Vida (Hooks)
  // ==========================================
  ngOnInit(): void {
    this.getHospitalUnities();
  }

  // ==========================================
  // Métodos Acessíveis pelo Template
  // ==========================================
  protected applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource().filter = filterValue.trim().toLowerCase();
  }

  protected checkPermissions(permissionName: string): boolean {
    const roles = this.route.parent?.parent?.snapshot.data['user']?.roles || [];
    for (const role of roles) {
      if (role.permissions.some((p: Permission) => p.name === permissionName)) {
        return false; // Permissão encontrada: habilita a ação
      }
    }
    return true; // Permissão não encontrada: desabilita a ação
  }

  protected showHospitalUnity(hospitalUnity: HospitalUnity): void {
    this.dialog.open(ShowHospitalUnityComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
      data: { hospital_unity: hospitalUnity }
    });
  }

  protected updateHospitalUnity(hospitalUnity: HospitalUnity): void {
    this.dialog.open(UpdateHospitalUnityComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
      data: { hospital_unity: hospitalUnity }
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) {
        this.upgradeHospitalUnities();
        TFD_HOSPITAL_UNITIES_CHANNEL.postMessage('update');
      }
    });
  }

  protected deleteHospitalUnity(hospitalUnity: HospitalUnity): void {
    this.dialog.open(DeleteHospitalUnityComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: { hospital_unity: hospitalUnity }
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) {
        this.upgradeHospitalUnities();
        TFD_HOSPITAL_UNITIES_CHANNEL.postMessage('update');
      }
    });
  }

  // ==========================================
  // Métodos Privados
  // ==========================================
  private getHospitalUnities(): void {
    this.openLoadingDialog();
    this.hospitalUnityService.getHospitalUnities()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.dataSource.set(new MatTableDataSource(response));
        },
        complete: () => {
          this.loadingDialog?.close();
        },
        error: () => {
          this.loadingDialog?.close();
        }
      });
  }

  private upgradeHospitalUnities(): void {
    this.hospitalUnityService.getHospitalUnities()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.dataSource.set(new MatTableDataSource(response));
        }
      });
  }

  private openLoadingDialog(): void {
    this.loadingDialog = this.dialog.open(LoadingComponent, {
      height: '200px',
      disableClose: true,
      autoFocus: false
    });
  }
}