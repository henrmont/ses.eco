import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

// Core, Models e Serviços
import { MessageService } from '../../../../core/services/message-service';
import { PatientRequestCostAssistanceService } from '../../../services/patient-request-cost-assistance.service';

interface UnifiedPassengerOption {
  id: number;
  name: string;
  isPatient: boolean;
  typeLabel: string;
}

@Component({
  selector: 'app-patient-request-cost-assistance-create',
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
  templateUrl: './patient-request-cost-assistance-create.component.html',
  styleUrl: './patient-request-cost-assistance-create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientRequestCostAssistanceCreateComponent implements OnInit {
  // ==========================================
  // Injeção de Dependências
  // ==========================================
  protected readonly data = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly fb = inject(FormBuilder);
  private readonly costAssistanceService = inject(PatientRequestCostAssistanceService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<PatientRequestCostAssistanceCreateComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // ==========================================
  // Mensagens de Erro por Controle
  // ==========================================
  protected readonly errorMessages: Record<string, Array<{ type: string; message: string }>> = {
    name: [
      { type: 'required', message: 'O nome da ajuda de custo é obrigatório.' }
    ],
    type: [
      { type: 'required', message: 'O tipo da ajuda de custo é obrigatório.' }
    ],
    passenger_id: [],
    bank: [],
    agency: [],
    account: []
  };

  // ==========================================
  // Estados Reativos via Signals
  // ==========================================
  protected readonly passengersOptions = signal<UnifiedPassengerOption[]>([]);
  protected readonly isSubmitting = signal<boolean>(false);

  // ==========================================
  // FormGroups
  // ==========================================
  protected createCostAssistanceForm!: FormGroup;

  // ==========================================
  // Ciclo de Vida (Hooks)
  // ==========================================
  ngOnInit(): void {
    this.extractPassengers();
    this.initForm();
  }

  // ==========================================
  // Inicialização de Formulário
  // ==========================================
  private initForm(): void {
    const hasInitial = !!this.data?.patient_request?.has_initial_cost_assistance;
    const initialType = hasInitial ? 'Complemento' : 'Inicial';

    this.createCostAssistanceForm = this.fb.group({
      name: [null, [Validators.required]],
      type: [initialType, [Validators.required]],
      passenger_id: [null],
      bank: [null],
      agency: [null],
      account: [null]
    });
  }

  // ==========================================
  // Helpers e Métodos Auxiliares
  // ==========================================
  /**
   * Extrai e mapeia a lista de passageiros sem duplicidade.
   */
  private extractPassengers(): void {
    const travels = this.data?.patient_request?.travels || [];
    const mapPassengers = new Map<string, UnifiedPassengerOption>();

    for (const travel of travels) {
      const passengers = travel?.passengers || [];

      for (const item of passengers) {
        const isPatient = !!item?.is_patient;
        const entity = isPatient ? (item?.patient || item) : item?.escort;

        if (entity?.id) {
          const mapKey = `${isPatient ? 'patient' : 'escort'}-${entity.id}`;

          if (!mapPassengers.has(mapKey)) {
            mapPassengers.set(mapKey, {
              id: item.id,
              name: entity.name || entity.full_name || `Passageiro ${entity.id}`,
              isPatient,
              typeLabel: isPatient ? 'Paciente' : 'Acompanhante'
            });
          }
        }
      }
    }

    this.passengersOptions.set(Array.from(mapPassengers.values()));
  }

  // ==========================================
  // Submissão
  // ==========================================
  protected onSubmit(): void {
    const requestId = this.data?.patient_request?.id;

    if (this.createCostAssistanceForm.invalid || !requestId) {
      this.createCostAssistanceForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    const payload = this.createCostAssistanceForm.getRawValue();

    this.costAssistanceService.createCostAssistance(requestId, payload)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Ajuda de custo criada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Ocorreu um erro ao criar a ajuda de custo.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}