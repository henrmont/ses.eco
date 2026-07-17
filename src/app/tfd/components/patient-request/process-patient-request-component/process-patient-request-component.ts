import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { map, Observable, startWith, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PatientRequestService } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-process-patient-request-component',
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
    MatChipsModule
  ],
  templateUrl: './process-patient-request-component.html',
  styleUrl: './process-patient-request-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessPatientRequestComponent implements OnInit {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly patientRequestService = inject(PatientRequestService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<ProcessPatientRequestComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // 🎯 Mapeamento local das mensagens de erro padronizado para a UI
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    medical_professional_control: [
      { type: 'required', message: 'A escolha de um profissional médico é obrigatória.' }
    ]
  };

  // Estrutura do Formulário e Controles expostos ao template
  protected patientRequestForm!: FormGroup;
  protected readonly medicalProfessionalControl = new FormControl<string | any>('', [Validators.required]);

  // Estados gerenciados reativamente via Signals
  protected readonly medicalProfessionalReadOnly = signal<boolean>(true);
  protected readonly medicalProfessionalLoading = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);

  // Listagem e Filtros de Autocomplete
  protected medicalProfessionalOptions: any[] = [];
  protected filteredMedicalProfessionalOptions!: Observable<any[]>;

  ngOnInit(): void {
    this.initForm();
    this.getMedicalProfessionals();
    this.registerCleaners();
  }

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO E SUPORTE ---

  private initForm(): void {
    this.patientRequestForm = this.fb.group({
      medical_professional_id: [null, [Validators.required]],
    });
  }

  /**
   * Monitora se o usuário limpou o texto dos autocompletes para invalidar o formulário principal
   */
  private registerCleaners(): void {
    this.medicalProfessionalControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!value) {
          this.patientRequestForm.get('medical_professional_id')?.setValue(null);
          this.patientRequestForm.get('medical_professional_id')?.markAsDirty();
          this.cdr.markForCheck();
        }
      });
  }

  private setMedicalProfessionalOptions(): void {
    this.filteredMedicalProfessionalOptions = this.medicalProfessionalControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterMedicalProfessional(name) : this.medicalProfessionalOptions.slice(0, 10);
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private _filterMedicalProfessional(name: string): any[] {
    const filterValue = name.toLowerCase().trim();
    return this.medicalProfessionalOptions
      .filter(option => option.name && option.name.toLowerCase().includes(filterValue))
      .slice(0, 10); // Limite de performance estrito
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected displayMedicalProfessional(medicalProfessional: any): string {
    return medicalProfessional?.name || '';
  }

  protected getMedicalProfessionals(): void {
    this.medicalProfessionalLoading.set(true);
    this.cdr.markForCheck();

    this.patientRequestService.getMedicalProfessionals()
      .pipe(
        finalize(() => {
          this.medicalProfessionalLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.medicalProfessionalOptions = response.map((item: any) => ({
              ...item?.patient,
              ...item
            }));
            
            this.setMedicalProfessionalOptions();
            this.medicalProfessionalReadOnly.set(false);
            this.cdr.markForCheck();
          }
        },
        error: () => {
          this.medicalProfessionalReadOnly.set(true);
          this.medicalProfessionalOptions = [];
          this.cdr.markForCheck();
        }
      });
  }

  protected onMedicalProfessionalSelected(option: any): void {
    if (option?.id) {
      this.patientRequestForm.get('medical_professional_id')?.setValue(option.id);
      this.patientRequestForm.get('medical_professional_id')?.markAsDirty();
      this.cdr.markForCheck();
    }
  }

  protected onSubmit(): void {
    this.medicalProfessionalControl.markAsTouched();

    if (this.patientRequestForm.invalid || this.medicalProfessionalControl.invalid) {
      this.patientRequestForm.markAllAsTouched();
      return;
    }

    const patientRequestId = this.data?.patient_request?.id;
    if (!patientRequestId) {
      this.messageService.showMessage('Identificador da solicitação não encontrado.');
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    this.patientRequestService.processPatientRequestToMedical(patientRequestId, this.patientRequestForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.messageService.showMessage(response?.message || 'Solicitação encaminhada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao tentar encaminhar a solicitação.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}