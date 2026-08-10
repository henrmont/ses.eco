import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Serviços
import { CostAssistanceService } from '../../../services/cost-assistance-service';
import { MessageService } from '../../../../core/services/message-service';

export interface UnifiedPassengerOption {
  id: number;
  name: string;
  isPatient: boolean;
  typeLabel: string;
}

@Component({
  selector: 'app-update-cost-assistance-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './update-cost-assistance-component.html',
  styleUrl: './update-cost-assistance-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateCostAssistanceComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly costAssistanceService = inject(CostAssistanceService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdateCostAssistanceComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Form Group Principal
  protected updateCostAssistanceForm!: FormGroup;

  // Estados reativos via Signals
  protected readonly passengersOptions = signal<UnifiedPassengerOption[]>([]);
  protected readonly isSubmitting = signal<boolean>(false);

  // Mensagens estáticas de erro do formulário
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    name: [
      { type: 'required', message: 'O nome da ajuda de custo é obrigatório.' }
    ],
    type: [
      { type: 'required', message: 'O tipo da ajuda de custo é obrigatório.' }
    ]
  };

  ngOnInit(): void {
    this.extractPassengers();
    this.initForm();
  }

  // --- EXTRAÇÃO E MAPEAMENTO DOS PASSAGEIROS ---

  private extractPassengers(): void {
    const travels = this.data?.cost_assistance?.patient_request?.travels || [];
    const mapPassengers = new Map<string, UnifiedPassengerOption>();

    for (const travel of travels) {
      const passengers = travel?.passengers || [];

      for (const item of passengers) {
        const isPatient = !!item?.is_patient;
        // Se for paciente, tenta extrair de item.patient ou do próprio item
        // Se for acompanhante, tenta extrair de item.escort
        const entity = isPatient ? (item?.patient || item) : item?.escort;

        if (entity?.id) {
          const mapKey = `${isPatient ? 'patient' : 'escort'}-${entity.id}`;

          if (!mapPassengers.has(mapKey)) {
            mapPassengers.set(mapKey, {
              id: entity.id,
              name: entity.name || entity.full_name || `Passageiro ${entity.id}`,
              isPatient: isPatient,
              typeLabel: isPatient ? 'Paciente' : 'Acompanhante'
            });
          }
        }
      }
    }

    this.passengersOptions.set(Array.from(mapPassengers.values()));
  }

  // --- INICIALIZAÇÃO E REGRAS DO FORMULÁRIO ---

  private initForm(): void {
    const costAssistance = this.data?.cost_assistance;

    this.updateCostAssistanceForm = this.fb.group({
      name: [costAssistance?.name || null, [Validators.required]],
      type: [costAssistance?.type || null, [Validators.required]],
      passenger_id: [costAssistance?.passenger_id || costAssistance?.passenger?.id || null],
      bank: [costAssistance?.bank || null],
      agency: [costAssistance?.agency || null],
      account: [costAssistance?.account || null]
    });
  }

  // --- SUBMISSÃO ---

  /**
   * Submete o formulário para atualização da ajuda de custo.
   */
  protected onSubmit(): void {
    const costAssistanceId = this.data?.cost_assistance?.id;

    if (this.updateCostAssistanceForm.invalid || !costAssistanceId) {
      this.updateCostAssistanceForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    const payload = this.updateCostAssistanceForm.getRawValue();

    this.costAssistanceService.updateCostAssistance(costAssistanceId, payload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Ajuda de custo atualizada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Ocorreu um erro ao atualizar a ajuda de custo.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}