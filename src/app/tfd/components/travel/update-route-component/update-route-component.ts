import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Importação segura do Moment
import * as _moment from 'moment';
const moment = (_moment as any).default || _moment;

import { TravelService, ApiResponse } from '../../../services/travel-service';
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';

@Component({
  selector: 'app-update-route-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }
  ],
  templateUrl: './update-route-component.html',
  styleUrl: './update-route-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateRouteComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly travelService = inject(TravelService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdateRouteComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Form Group Principal
  protected updateRouteForm!: FormGroup;

  // Estados reativos via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // Mensagens estáticas de erro do formulário
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    origin: [
      { type: 'required', message: 'A cidade de origem é obrigatória.' }
    ],
    destination: [
      { type: 'required', message: 'A cidade de destino é obrigatória.' }
    ],
    distance: [
      { type: 'min', message: 'A distância não pode ser negativa.' }
    ],
    departure: [
      { type: 'invalidDate', message: 'Data de saída inválida.' }
    ],
    arrival: [
      { type: 'invalidDate', message: 'Data de chegada inválida.' }
    ],
    flight: [],
    airplane: [],
    class: [],
    scales: [],
    family: []
  };

  ngOnInit(): void {
    this.initForm();
  }

  // --- INICIALIZAÇÃO E REGRAS DO FORMULÁRIO ---

  private initForm(): void {
    const route = this.data?.route;

    // Converte datas recebidas para instâncias do Moment caso existam
    const departureRaw = route?.departure || route?.departureTime || route?.departure_time;
    const arrivalRaw = route?.arrival || route?.arrivalTime || route?.arrival_time;

    const departureVal = departureRaw ? moment(departureRaw) : null;
    const arrivalVal = arrivalRaw ? moment(arrivalRaw) : null;

    this.updateRouteForm = this.fb.group({
      flight: [route?.flight || route?.flightNumber || route?.flight_number || null],
      airplane: [route?.airplane || route?.aircraft || null],
      departure: [departureVal, [CustomValidators.dateValidator()]],
      arrival: [arrivalVal, [CustomValidators.dateValidator()]],
      origin: [route?.origin ?? null, [Validators.required]],
      destination: [route?.destination ?? null, [Validators.required]],
      distance: [route?.distance ?? null, [Validators.min(0)]],
      class: [route?.class ?? null],
      scales: [route?.scales || route?.stopover || route?.stops || null],
      family: [route?.family || route?.fare_family || null]
    });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE ---

  protected setDepartureDate(event: MatDatepickerInputEvent<any>): void {
    if (event.value) {
      const parsedDate = moment(event.value);
      if (parsedDate.isValid()) {
        this.updateRouteForm.get('departure')?.setValue(parsedDate, { emitEvent: true });
        this.updateRouteForm.get('departure')?.markAsDirty();
      }
    }
  }

  protected setArrivalDate(event: MatDatepickerInputEvent<any>): void {
    if (event.value) {
      const parsedDate = moment(event.value);
      if (parsedDate.isValid()) {
        this.updateRouteForm.get('arrival')?.setValue(parsedDate, { emitEvent: true });
        this.updateRouteForm.get('arrival')?.markAsDirty();
      }
    }
  }

  // --- SUBMISSÃO ---

  protected onSubmit(): void {
    const routeId = this.data?.route?.id;

    if (this.updateRouteForm.invalid || !routeId) {
      this.updateRouteForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    const payload = this.updateRouteForm.getRawValue();

    this.travelService.updateRoute(routeId, payload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: ApiResponse) => {
          this.messageService.showMessage(response?.message || 'Rota atualizada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao processar a atualização da rota.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}