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

@Component({
  selector: 'app-create-patient-report-component',
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
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly patientService = inject(PatientService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<CreatePatientReportComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estrutura do Formulário e Controles expostos ao template
  protected reportForm!: FormGroup;
  protected readonly cidControl = new FormControl<string | any>('', [Validators.required]);

  // Estados gerenciados reativamente via Signals
  protected readonly cidReadOnly = signal<boolean>(true);
  protected readonly cidLoading = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);

  // Listagem e Filtros do Autocomplete
  private cidOptions: any[] = [];
  protected filteredCidOptions!: Observable<any[]>;

  // 🎯 Mapeamento local das mensagens de erro padronizado para a UI
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    protocol: [
      { type: 'required', message: 'O número do protocolo é obrigatório.' }
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
    this.fetchCids();
    this.registerCidCleaner();
  }

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO E SUPORTE ---

  private initForm(): void {
    this.reportForm = this.fb.group({
      protocol: [null, [Validators.required]],
      cid_id: [null, [Validators.required]],
      lawsuit: [false, [Validators.required]],
      diagnosis: [null, [Validators.required]],
    });
  }

  /**
   * Monitora se o usuário limpou o texto do autocomplete para invalidar o formulário principal
   */
  private registerCidCleaner(): void {
    this.cidControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!value) {
          this.reportForm.get('cid_id')?.setValue(null);
          this.reportForm.get('cid_id')?.markAsDirty();
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

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected displayCid(cid: any): string {
    return cid && cid.name && cid.code ? `${cid.code} - ${cid.name}` : '';
  }

  protected fetchCids(): void {
    const careId = this.data?.patient_care?.id;
    if (!careId) return;

    this.cidLoading.set(true);
    this.cdr.detectChanges(); // Garante o spinner de loading visível imediatamente no OnPush

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

  protected onSubmit(): void {
    const patientCareId = this.data?.patient_care?.id;
    if (!patientCareId) {
      this.messageService.showMessage('Identificador do atendimento do paciente inválido.');
      return;
    }

    if (this.reportForm.invalid || this.cidControl.invalid) {
      this.reportForm.markAllAsTouched();
      this.cidControl.markAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.detectChanges(); // Sincroniza imediatamente o estado de submissão no DOM

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