import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { map, Observable, startWith, finalize } from 'rxjs';

import { CostAssistanceService } from '../../../services/cost-assistance-service';
import { MessageService } from '../../../../core/services/message-service';
import { Archive } from '../../../models/archive';

@Component({
  selector: 'app-process-patient-request-to-payment-component',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatAutocompleteModule, 
    MatProgressSpinnerModule, 
    MatChipsModule, 
    MatListModule, 
    MatSlideToggleModule
  ],
  templateUrl: './process-patient-request-to-payment-component.html',
  styleUrl: './process-patient-request-to-payment-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class ProcessPatientRequestToPaymentComponent implements OnInit {
  // Injeções de Dependência via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly costAssistanceService = inject(CostAssistanceService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<ProcessPatientRequestToPaymentComponent>);
  private readonly cdr = inject(ChangeDetectorRef);

  // Mapeamento local das mensagens de erro customizadas
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    payment_professional_id: [
      { type: 'required', message: 'A seleção do profissional de pagamento é obrigatória.' }
    ]
  };

  // Formulário Principal e Controles Independentes do Autocomplete
  protected tramitPatientRequestForm!: FormGroup;
  protected readonly paymentProfessionalControl = new FormControl<string | any>('', [Validators.required]);

  // Estados reativos com Signals
  protected readonly paymentProfessionalReadOnly = signal<boolean>(true);
  protected readonly paymentProfessionalLoading = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);

  // Filtros e Listas de Opções
  protected paymentProfessionalOptions: any[] = [];
  protected filteredPaymentProfessionalOptions!: Observable<any[]>;

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.getPaymentProfessionals();
  }

  // --- MÉTODOS PRIVADOS DE SUPORTE ---

  private initForm(): void {
    this.tramitPatientRequestForm = this.fb.group({
      payment_professional_id: [null, [Validators.required]],
      archives: [[]]
    });
  }

  private setPaymentProfessionalOptions(): void {
    this.filteredPaymentProfessionalOptions = this.paymentProfessionalControl.valueChanges.pipe(
      startWith(this.paymentProfessionalControl.value),
      map(value => {
        if (value && typeof value === 'object') {
          return this._filterPaymentProfessional(value.name || '');
        }
        return value ? this._filterPaymentProfessional(value as string) : this.paymentProfessionalOptions.slice(0, 10);
      })
    );
  }

  private _filterPaymentProfessional(searchTerm: string): any[] {
    if (!searchTerm) {
      return this.paymentProfessionalOptions.slice(0, 10);
    }
    const filterValue = searchTerm.toLowerCase().trim();
    return this.paymentProfessionalOptions
      .filter(option => option.name && option.name.toLowerCase().includes(filterValue))
      .slice(0, 10);
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected displayPaymentProfessional(professional: any): string {
    return professional?.name || '';
  }

  protected toggleArchive(item: Archive): void {
    const currentArchives: number[] = this.tramitPatientRequestForm.get('archives')?.value || [];
    const index = currentArchives.indexOf(item.id);

    let updatedArchives: number[];
    if (index !== -1) {
      updatedArchives = currentArchives.filter(id => id !== item.id);
    } else {
      updatedArchives = [...currentArchives, item.id];
    }

    this.tramitPatientRequestForm.patchValue({ archives: updatedArchives });
    this.tramitPatientRequestForm.markAsDirty();
    this.cdr.markForCheck();
  }

  protected getPaymentProfessionals(): void {
    this.paymentProfessionalLoading.set(true);

    this.costAssistanceService.getPaymentProfessionals()
      .pipe(finalize(() => {
        this.paymentProfessionalLoading.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          if (response) {
            this.paymentProfessionalOptions = response.map((item: any) => ({
              ...item?.patient,
              ...item
            }));
            this.setPaymentProfessionalOptions();
            this.paymentProfessionalReadOnly.set(false);
            this.cdr.markForCheck();
          }
        },
        error: () => {
          this.paymentProfessionalReadOnly.set(true);
        }
      });
  }

  protected setPaymentProfessional(option: any): void {
    if (option?.id) {
      this.tramitPatientRequestForm.get('payment_professional_id')?.setValue(option.id);
      this.tramitPatientRequestForm.markAsDirty();
    }
  }

  protected onSubmit(): void {
    if (this.tramitPatientRequestForm.invalid) {
      this.tramitPatientRequestForm.markAllAsTouched();
      this.paymentProfessionalControl.markAsTouched();
      return;
    }

    const requestId = this.data?.patient_request?.id;
    if (!requestId) {
      this.messageService.showMessage('Erro: Identificador da solicitação não encontrado.');
      return;
    }

    this.isSubmitting.set(true);

    this.costAssistanceService.processPatientRequestToPayment(requestId, this.tramitPatientRequestForm.getRawValue())
      .pipe(finalize(() => {
        this.isSubmitting.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response.message || 'Solicitação processada para pagamento com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const errMsg = err?.error?.message || 'Erro ao tentar processar a solicitação para pagamento.';
          this.messageService.showMessage(errMsg);
        }
      });
  }
}