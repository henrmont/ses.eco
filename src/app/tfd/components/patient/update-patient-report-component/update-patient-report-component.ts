import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { map, Observable, startWith, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';
import { StorageService } from '../../../../core/services/storage-service';
import { Specialty } from '../../../enums/specialties';

interface SpecialtyOption {
  key: string;
  label: string;
}

@Component({
  selector: 'app-update-patient-report-component',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatIconModule, 
    MatSlideToggleModule, 
    MatTooltipModule, 
    MatAutocompleteModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './update-patient-report-component.html',
  styleUrl: './update-patient-report-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdatePatientReportComponent implements OnInit {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly storageService = inject(StorageService);
  private readonly dialogRef = inject(MatDialogRef<UpdatePatientReportComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Mapeamento local das mensagens de erro padronizado para a UI
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    protocol: [
      { type: 'required', message: 'O número do protocolo é obrigatório.' }
    ],
    specialty: [
      { type: 'required', message: 'A seleção da especialidade é obrigatória.' }
    ],
    cid_id: [
      { type: 'required', message: 'A seleção do CID é obrigatória para o laudo.' }
    ],
    lawsuit: [
      { type: 'required', message: 'Informe se o laudo possui processo judicial.' }
    ],
    diagnosis: [
      { type: 'required', message: 'A descrição do diagnóstico é obrigatória.' }
    ]
  };

  // Estrutura do Formulário e Controles expostos ao template
  protected reportForm!: FormGroup;
  protected readonly cidControl = new FormControl<string | any>({ value: '', disabled: this.data?.report?.is_export }, [Validators.required]);
  protected readonly specialtyControl = new FormControl<string | SpecialtyOption>({ value: '', disabled: this.data?.report?.is_export }, [Validators.required]);

  // Estados gerenciados reativamente via Signals
  protected readonly cidReadOnly = signal<boolean>(true);
  protected readonly cidLoading = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);

  // Listagem e Filtros do Autocomplete
  private cidOptions: any[] = [];
  protected filteredCidOptions!: Observable<any[]>;

  private specialtyOptions: SpecialtyOption[] = [];
  protected filteredSpecialtyOptions!: Observable<SpecialtyOption[]>;

  ngOnInit(): void {
    this.initForm();
    this.loadSpecialties();
    this.getCids();
    this.registerCleaners();
  }

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO E SUPORTE ---

  private initForm(): void {
    this.reportForm = this.fb.group({
      protocol: [{ value: this.data?.report?.protocol, disabled: this.data?.report?.is_export }, [Validators.required]],
      specialty: [this.data?.report?.specialty, [Validators.required]],
      cid_id: [this.data?.report?.cid_id || this.data?.report?.cid?.id, [Validators.required]],
      lawsuit: [{ value: !!this.data?.report?.lawsuit, disabled: this.data?.report?.is_export }, [Validators.required]],
      diagnosis: [this.data?.report?.diagnosis, [Validators.required]],
    });
  }

  private loadSpecialties(): void {
    this.specialtyOptions = Object.entries(Specialty).map(([key, value]) => ({
      key,
      label: value
    }));

    const initialKey = this.data?.report?.specialty;
    const initialOption = this.specialtyOptions.find(opt => opt.key === initialKey);

    if (initialOption) {
      this.specialtyControl.setValue(initialOption);
    }

    this.filteredSpecialtyOptions = this.specialtyControl.valueChanges.pipe(
      startWith(this.specialtyControl.value),
      map(value => {
        if (value && typeof value === 'object') {
          return this._filterSpecialty(value.label || '');
        }
        return value ? this._filterSpecialty(value as string) : this.specialtyOptions.slice(0, 10);
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  /**
   * Monitora se o usuário limpou os autocompletes para invalidar o formulário
   */
  private registerCleaners(): void {
    this.cidControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!value || typeof value !== 'object') {
          this.reportForm.get('cid_id')?.setValue(null);
          this.reportForm.get('cid_id')?.markAsDirty();
        }
      });

    this.specialtyControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!value || typeof value !== 'object') {
          this.reportForm.get('specialty')?.setValue(null);
          this.reportForm.get('specialty')?.markAsDirty();
        }
      });
  }

  private setCidOptions(): void {
    this.filteredCidOptions = this.cidControl.valueChanges.pipe(
      startWith(this.cidControl.value),
      map(value => {
        if (value && typeof value === 'object') {
          return this._filterCid(value.code || value.name || '');
        }
        return value ? this._filterCid(value as string) : this.cidOptions.slice(0, 10);
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private _filterCid(searchTerm: string): any[] {
    if (!searchTerm) {
      return this.cidOptions.slice(0, 10);
    }

    const filterValue = searchTerm.toLowerCase().trim();

    return this.cidOptions
      .filter(option => 
        (option.code && option.code.toLowerCase().includes(filterValue)) || 
        (option.name && option.name.toLowerCase().includes(filterValue))
      )
      .slice(0, 10);
  }

  private _filterSpecialty(label: string): SpecialtyOption[] {
    if (!label) {
      return this.specialtyOptions.slice(0, 10);
    }

    const filterValue = label.toLowerCase().trim();
    return this.specialtyOptions
      .filter(option => option.label.toLowerCase().includes(filterValue))
      .slice(0, 10);
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected displayCid(cid: any): string {
    return cid && cid.name && cid.code ? `${cid.code} - ${cid.name}` : '';
  }

  protected displaySpecialty(specialty: SpecialtyOption): string {
    return specialty?.label || '';
  }

  protected getCids(): void {
    const patientCareId = this.data?.report?.patient_care?.id || this.data?.report?.patient_care_id;
    if (!patientCareId) return;

    this.cidLoading.set(true);
    this.cdr.detectChanges();

    this.patientService.getCids(patientCareId)
      .pipe(
        finalize(() => {
          this.cidLoading.set(false);
          this.cdr.detectChanges();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.cidOptions = response || [];
          
          this.setCidOptions(); 
          
          if (this.data.report.cid) {
            this.cidControl.setValue(this.data.report.cid);
          }
          
          this.cidReadOnly.set(false);
          this.cdr.detectChanges();
        },
        error: () => {
          this.cidReadOnly.set(true);
          this.cidOptions = [];
        }
      });
  }

  protected setCid(cid: any): void {
    this.reportForm.get('cid_id')?.setValue(cid.id);
    this.reportForm.get('cid_id')?.markAsDirty();
  }

  protected setSpecialty(option: SpecialtyOption): void {
    this.reportForm.get('specialty')?.setValue(option.key);
    this.reportForm.get('specialty')?.markAsDirty();
  }

  protected onSubmit(): void {
    const reportId = this.data?.report?.id;
    if (!reportId) {
      this.messageService.showMessage('Identificador do laudo inválido.');
      return;
    }

    if (this.reportForm.invalid || this.cidControl.invalid || this.specialtyControl.invalid) {
      this.reportForm.markAllAsTouched();
      this.cidControl.markAsTouched();
      this.specialtyControl.markAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.detectChanges();

    this.patientService.updatePatientReport(reportId, this.reportForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.detectChanges();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response.message || 'Laudo atualizado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Ocorreu um erro ao tentar atualizar o laudo médico.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}