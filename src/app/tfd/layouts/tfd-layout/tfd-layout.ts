import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; // 👈 Essencial para proteger as assinaturas dos modais
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs'; // 👈 Importado para simplificar o fechamento do loading
import { MessageService } from '../../../core/services/message-service';
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { CreateUserComponent } from '../../components/user/create-user-component/create-user-component';
import { CreateRoleComponent } from '../../components/role/create-role-component/create-role-component';
import { CreateHospitalUnityComponent } from '../../components/hospital-unity/create-hospital-unity-component/create-hospital-unity-component';
import { DatasusService } from '../../services/datasus-service';
import { CreatePatientComponent } from '../../components/patient/create-patient-component/create-patient-component';
import { CreatePatientRequestComponent } from '../../components/patient-request/create-patient-request-component/create-patient-request-component';
import { ImportTravelsComponent } from '../../components/travel/import-travels-component/import-travels-component';

// Broadcast Channels centralizados
const TFD_ROLES_CHANNEL = new BroadcastChannel('tfd-roles-channel');
const TFD_USERS_CHANNEL = new BroadcastChannel('tfd-users-channel');
const TFD_HOSPITAL_UNITIES_CHANNEL = new BroadcastChannel('tfd-hospital-unities-channel');
const TFD_SIGTAP_CHANNEL = new BroadcastChannel('tfd-sigtap-channel');
const TFD_PATIENTS_CHANNEL = new BroadcastChannel('tfd-patients-channel');
const TFD_PATIENT_REQUESTS_CHANNEL = new BroadcastChannel('tfd-patient-requests-channel');
const TFD_TRAVELS_CHANNEL = new BroadcastChannel('tfd-travels-channel');

@Component({
  selector: 'app-tfd-layout',
  imports: [MatSidenavModule, MatListModule, MatIconModule, RouterModule, MatMenuModule],
  templateUrl: './tfd-layout.html',
  styleUrl: './tfd-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush, // ⚡ Alta performance ativada
})
export class TfdLayout {
  // Injeção de dependências moderna
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly messageService = inject(MessageService);
  private readonly datasusService = inject(DatasusService);
  private readonly destroyRef = inject(DestroyRef); // 👈 Injetado para gerenciar as assinaturas de forma limpa

  // ElementRef usando a sintaxe moderna de viewChild signal
  readonly competence = viewChild.required<ElementRef>('competence');
  
  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private file!: File;

  /**
   * Verifica as permissões baseando-se no snapshot da rota atual.
   * Como usamos OnPush, certifique-se de que este método seja invocado em contextos 
   * que disparam a detecção (como navegações de rota ou cliques do usuário).
   */
  checkPermission(names: string[]): boolean {
    const module = this.route.snapshot.routeConfig?.path;
    const roles = this.route.parent?.snapshot.data['user']?.roles || [];
    
    for (const item of roles) {
      const permissions: string[] = item.permissions.map((p: any) => p.name);
      for (const name of names) {
        if (permissions.includes(`${module}/${name}`)) {
          return true;
        }
      }
    }
    return false;
  }

  createUser(): void {
    this.dialog.open(CreateUserComponent, {
      width: '700px',
      disableClose: true,
      autoFocus: false,
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef)) // 🔒 Proteção contra vazamento de memória
      .subscribe(result => {
        if (result) TFD_USERS_CHANNEL.postMessage('update');
      });
  }

  createRole(): void {
    this.dialog.open(CreateRoleComponent, {
      disableClose: true,
      autoFocus: false,
      width: '900px',
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) TFD_ROLES_CHANNEL.postMessage('update');
      });
  }

  createHospitalUnity(): void {
    this.dialog.open(CreateHospitalUnityComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) TFD_HOSPITAL_UNITIES_CHANNEL.postMessage('update');
      });
  }

  importCompetence(): void {
    this.competence().nativeElement.click();
  }

  onFileChange(event: any): void {
    const files = event.target.files;
    if (files.length > 0 && files[0].type === 'application/zip') {
      this.loading();
      this.file = files[0];
      
      this.datasusService.process(this.file)
        .pipe(
          // 🌟 Garante o fechamento do loading independente de sucesso ou falha na API
          finalize(() => {
            if (this.loadingDialog) this.loadingDialog.close();
            event.target.value = ''; // 👈 Limpa o input para permitir re-upload do mesmo arquivo se necessário
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (response) => {
            this.messageService.showMessage(response.message);
            TFD_SIGTAP_CHANNEL.postMessage('update');
          },
          error: (error) => {
            const fallbackError = error?.error?.message || 'Erro ao processar arquivo';
            this.messageService.showMessage(fallbackError);
          },
        });
    } else {
      event.target.value = ''; // Limpa se o formato for inválido
    }
  }

  loading(): void {
    this.loadingDialog = this.dialog.open(LoadingComponent, {
      height: '200px',
      disableClose: true,
      autoFocus: false,
    });
  }
        
  createPatient(): void {
    this.dialog.open(CreatePatientComponent, {
      width: '1200px',
      height: '700px',
      disableClose: true,
      autoFocus: false,
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) TFD_PATIENTS_CHANNEL.postMessage('update');
      });
  }

  createPatientRequest(): void {
    this.dialog.open(CreatePatientRequestComponent, {
      width: '800px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) TFD_PATIENT_REQUESTS_CHANNEL.postMessage('update');
      });
  }

  importTravels(): void {
    this.dialog.open(ImportTravelsComponent, {
      width: '400px',
      height: 'auto',
      disableClose: true,
      autoFocus: false,
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) TFD_TRAVELS_CHANNEL.postMessage('update');
      });
  }
}