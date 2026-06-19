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
import { map, Observable, startWith, finalize } from 'rxjs';

import { PatientRequestService } from '../../../services/patient-request-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-process-patient-request-component',
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
    MatChipsModule
  ],
  templateUrl: './process-patient-request-component.html',
  styleUrl: './process-patient-request-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class ProcessPatientRequestComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly patientRequestService = inject(PatientRequestService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<ProcessPatientRequestComponent>);
  private readonly cdr = inject(ChangeDetectorRef);

  // Mapeamento local das mensagens de erro (idêntico ao modelo de referência)
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    medical_professional_id: [
      { type: 'required', message: 'A escolha de um profissional médico é obrigatória.' }
    ]
  };

  // Formulário e Controles expostos ao template
  protected tramitPatientRequestForm!: FormGroup;
  protected readonly medicalProfessionalControl = new FormControl<string | any>('');

  // Estados reativos com Signals
  protected readonly medicalProfessionalReadOnly = signal<boolean>(true);
  protected readonly medicalProfessionalLoading = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);

  // Filtros e opções do Autocomplete
  protected medicalProfessionalOptions: any[] = [];
  protected filteredMedicalProfessionalOptions!: Observable<any[]>;

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.getMedicalProfessionals();
  }

  // --- MÉTODOS PRIVADOS DE SUPORTE ---

  private initForm(): void {
    this.tramitPatientRequestForm = this.fb.group({
      medical_professional_id: [null, [Validators.required]],
    });
  }

  private setMedicalProfessionalOptions(): void {
    this.filteredMedicalProfessionalOptions = this.medicalProfessionalControl.valueChanges.pipe(
      startWith(this.medicalProfessionalControl.value),
      map(value => {
        if (value && typeof value === 'object') {
          return this._filterMedicalProfessional(value.name || '');
        }
        return value ? this._filterMedicalProfessional(value as string) : this.medicalProfessionalOptions.slice(0, 10);
      })
    );
  }

  private _filterMedicalProfessional(searchTerm: string): any[] {
    if (!searchTerm) {
      return this.medicalProfessionalOptions.slice(0, 10);
    }

    const filterValue = searchTerm.toLowerCase().trim();

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

    this.patientRequestService.getMedicalProfessionals()
      .pipe(finalize(() => {
        this.medicalProfessionalLoading.set(false);
        this.cdr.markForCheck(); // Sincroniza view após stream assíncrona
      }))
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
        }
      });
  }

  protected setMedicalProfessional(option: any): void {
    this.tramitPatientRequestForm.get('medical_professional_id')?.setValue(option.id);
    this.tramitPatientRequestForm.markAsDirty();
  }

  protected onSubmit(): void {
    if (this.tramitPatientRequestForm.invalid) {
      this.tramitPatientRequestForm.markAllAsTouched();
      this.medicalProfessionalControl.markAsTouched();
      return;
    }

    const requestId = this.data?.patient_request?.id;
    if (!requestId) {
      this.messageService.showMessage('Erro: Identificador da solicitação não encontrado.');
      return;
    }

    this.isSubmitting.set(true);

    this.patientRequestService.processPatientRequestToMedical(requestId, this.tramitPatientRequestForm.getRawValue())
      .pipe(finalize(() => {
        this.isSubmitting.set(false);
        this.cdr.markForCheck(); // Assegura desligamento visual estável
      }))
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response.message || 'Solicitação encaminhada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const errMsg = err?.error?.message || 'Erro ao tentar encaminhar a solicitação.';
          this.messageService.showMessage(errMsg);
        }
      });
  }
}