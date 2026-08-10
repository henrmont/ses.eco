import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { map, Observable, startWith, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PatientService } from '../../../services/patient-service';
import { MessageService } from '../../../../core/services/message-service';
import { Specialty } from '../../../enums/specialties';

interface SpecialtyOption {
  key: string;
  label: string;
}

@Component({
  selector: 'app-create-patient-report-component',
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
    MatProgressSpinnerModule, 
    MatAutocompleteModule
  ],
  templateUrl: './create-patient-report-component.html',
  styleUrl: './create-patient-report-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePatientReportComponent implements OnInit {
  // Injeções de Dependência
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<CreatePatientReportComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estrutura do Formulário
  protected reportForm!: FormGroup;
  protected readonly cidControl = new FormControl<string | any>('', [Validators.required]);
  protected readonly specialtyControl = new FormControl<string | SpecialtyOption>('', [Validators.required]);

  // Estados gerenciados por Signals
  protected readonly cidReadOnly = signal<boolean>(true);
  protected readonly cidLoading = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);

  // Listagem e Filtros
  private cidOptions: any[] = [];
  protected filteredCidOptions!: Observable<any[]>;

  private specialtyOptions: SpecialtyOption[] = [];
  protected filteredSpecialtyOptions!: Observable<SpecialtyOption[]>;

  // Mensagens de Erro para UI
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

  ngOnInit(): void {
    this.initForm();
    this.loadSpecialties();
    this.fetchCids();
    this.registerCleaners();
  }

  // --- INICIALIZAÇÃO ---

  private initForm(): void {
    this.reportForm = this.fb.group({
      protocol: [null, [Validators.required]],
      specialty: [null, [Validators.required]],
      cid_id: [null, [Validators.required]],
      lawsuit: [false, [Validators.required]],
      diagnosis: [null, [Validators.required]],
    });
  }

  private loadSpecialties(): void {
    this.specialtyOptions = Object.entries(Specialty).map(([key, value]) => ({
      key,
      label: value
    }));

    this.filteredSpecialtyOptions = this.specialtyControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const term = typeof value === 'string' ? value : value?.label || '';
        return term ? this._filterSpecialty(term) : this.specialtyOptions.slice(0, 10);
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private registerCleaners(): void {
    // Limpeza de CID
    this.cidControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!value || typeof value !== 'object') {
          this.reportForm.get('cid_id')?.setValue(null);
          this.reportForm.get('cid_id')?.markAsDirty();
        }
      });

    // Limpeza de Especialidade
    this.specialtyControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!value || typeof value !== 'object') {
          this.reportForm.get('specialty')?.setValue(null);
          this.reportForm.get('specialty')?.markAsDirty();
        }
      });
  }

  private configureCidFilter(): void {
    this.filteredCidOptions = this.cidControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : (value?.code ? `${value.code} - ${value.name}` : '');
        return name ? this._filterCid(name) : this.cidOptions.slice(0, 10);
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private _filterCid(name: string): any[] {
    const filterValue = name.toLowerCase();
    return this.cidOptions.filter(option => 
      option.name.toLowerCase().includes(filterValue) || 
      option.code.toLowerCase().includes(filterValue)
    ).slice(0, 10);
  }

  private _filterSpecialty(label: string): SpecialtyOption[] {
    const filterValue = label.toLowerCase();
    return this.specialtyOptions.filter(option => 
      option.label.toLowerCase().includes(filterValue)
    ).slice(0, 10);
  }

  // --- AÇÕES DO TEMPLATE ---

  protected displayCid(cid: any): string {
    return cid && cid.name && cid.code ? `${cid.code} - ${cid.name}` : '';
  }

  protected displaySpecialty(specialty: SpecialtyOption): string {
    return specialty?.label || '';
  }

  protected fetchCids(): void {
    const careId = this.data?.patient_care?.id;
    if (!careId) return;

    this.cidLoading.set(true);
    this.cdr.detectChanges();

    this.patientService.getCids(careId)
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
          this.configureCidFilter();
          this.cidReadOnly.set(false);
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
    const patientCareId = this.data?.patient_care?.id;
    if (!patientCareId) {
      this.messageService.showMessage('Identificador do atendimento do paciente inválido.');
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

    this.patientService.createPatientReport(patientCareId, this.reportForm.value)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.detectChanges();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Laudo criado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Ocorreu um erro ao processar a criação do laudo.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}