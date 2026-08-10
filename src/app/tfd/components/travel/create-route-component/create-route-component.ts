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
  selector: 'app-create-route-component',
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
  templateUrl: './create-route-component.html',
  styleUrl: './create-route-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateRouteComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly travelService = inject(TravelService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<CreateRouteComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Form Group Principal
  protected createRouteForm!: FormGroup;

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
    this.createRouteForm = this.fb.group({
      flight: [null],
      airplane: [null],
      departure: [null, [CustomValidators.dateValidator()]],
      arrival: [null, [CustomValidators.dateValidator()]],
      origin: [null, [Validators.required]],
      destination: [null, [Validators.required]],
      distance: [null, [Validators.min(0)]],
      class: [null],
      scales: [null],
      family: [null]
    });
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE ---

  protected setDepartureDate(event: MatDatepickerInputEvent<any>): void {
    if (event.value) {
      const parsedDate = moment(event.value);
      if (parsedDate.isValid()) {
        this.createRouteForm.get('departure')?.setValue(parsedDate, { emitEvent: true });
        this.createRouteForm.get('departure')?.markAsDirty();
      }
    }
  }

  protected setArrivalDate(event: MatDatepickerInputEvent<any>): void {
    if (event.value) {
      const parsedDate = moment(event.value);
      if (parsedDate.isValid()) {
        this.createRouteForm.get('arrival')?.setValue(parsedDate, { emitEvent: true });
        this.createRouteForm.get('arrival')?.markAsDirty();
      }
    }
  }

  // --- SUBMISSÃO ---

  protected onSubmit(): void {
    const travelId = this.data?.travel?.id;

    if (this.createRouteForm.invalid || !travelId) {
      this.createRouteForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    const payload = this.createRouteForm.getRawValue();

    this.travelService.createRoute(travelId, payload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: ApiResponse) => {
          this.messageService.showMessage(response?.message || 'Rota criada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao processar a criação da rota.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}