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

import { OpinionService } from '../../../services/opinion-service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-process-patient-request-to-cost-assistance-and-travel-component',
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
  templateUrl: './process-patient-request-to-cost-assistance-and-travel-component.html',
  styleUrl: './process-patient-request-to-cost-assistance-and-travel-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class ProcessPatientRequestToCostAssistanceAndTravelComponent implements OnInit {
  // Injeções de Dependência via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly opinionService = inject(OpinionService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<ProcessPatientRequestToCostAssistanceAndTravelComponent>);
  private readonly cdr = inject(ChangeDetectorRef);

  // Mapeamento local das mensagens de erro customizadas
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    cost_assistance_professional_id: [
      { type: 'required', message: 'A escolha de um profissional de ajuda de custo é obrigatória.' }
    ]
  };

  // Formulário Principal e Controles Independentes do Autocomplete
  protected tramitPatientRequestForm!: FormGroup;
  protected readonly costAssistanceProfessionalControl = new FormControl<string | any>('', [Validators.required]);
  protected readonly travelProfessionalControl = new FormControl<string | any>('');

  // Estados reativos com Signals (Ajuda de Custo)
  protected readonly costAssistanceProfessionalReadOnly = signal<boolean>(true);
  protected readonly costAssistanceProfessionalLoading = signal<boolean>(false);

  // Estados reativos com Signals (TFD / Viagem)
  protected readonly travelProfessionalReadOnly = signal<boolean>(true);
  protected readonly travelProfessionalLoading = signal<boolean>(false);
  
  // Estado global de submissão da modal
  protected readonly isSubmitting = signal<boolean>(false);

  // Filtros e Listas de Opções
  protected costAssistanceProfessionalOptions: any[] = [];
  protected filteredCostAssistanceProfessionalOptions!: Observable<any[]>;

  protected travelProfessionalOptions: any[] = [];
  protected filteredTravelProfessionalOptions!: Observable<any[]>;

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.getCostAssistanceProfessionals();
    this.getTravelProfessionals();
  }

  // --- MÉTODOS PRIVADOS DE SUPORTE ---

  private initForm(): void {
    this.tramitPatientRequestForm = this.fb.group({
      cost_assistance_professional_id: [null, [Validators.required]],
      travel_professional_id: [null],
    });
  }

  // --- COMPORTAMENTOS: AJUDA DE CUSTO ---

  private setCostAssistanceProfessionalOptions(): void {
    this.filteredCostAssistanceProfessionalOptions = this.costAssistanceProfessionalControl.valueChanges.pipe(
      startWith(this.costAssistanceProfessionalControl.value),
      map(value => {
        if (value && typeof value === 'object') {
          return this._filterCostAssistance(value.name || '');
        }
        return value ? this._filterCostAssistance(value as string) : this.costAssistanceProfessionalOptions.slice(0, 10);
      })
    );
  }

  private _filterCostAssistance(searchTerm: string): any[] {
    if (!searchTerm) {
      return this.costAssistanceProfessionalOptions.slice(0, 10);
    }
    const filterValue = searchTerm.toLowerCase().trim();
    return this.costAssistanceProfessionalOptions
      .filter(option => option.name && option.name.toLowerCase().includes(filterValue))
      .slice(0, 10);
  }

  // --- COMPORTAMENTOS: TFD / VIAGEM ---

  private setTravelProfessionalOptions(): void {
    this.filteredTravelProfessionalOptions = this.travelProfessionalControl.valueChanges.pipe(
      startWith(this.travelProfessionalControl.value),
      map(value => {
        if (value && typeof value === 'object') {
          return this._filterTravel(value.name || '');
        }
        return value ? this._filterTravel(value as string) : this.travelProfessionalOptions.slice(0, 10);
      })
    );
  }

  private _filterTravel(searchTerm: string): any[] {
    if (!searchTerm) {
      return this.travelProfessionalOptions.slice(0, 10);
    }
    const filterValue = searchTerm.toLowerCase().trim();
    return this.travelProfessionalOptions
      .filter(option => option.name && option.name.toLowerCase().includes(filterValue))
      .slice(0, 10);
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected displayCostAssistanceProfessional(professional: any): string {
    return professional?.name || '';
  }

  protected displayTravelProfessional(professional: any): string {
    return professional?.name || '';
  }

  protected getCostAssistanceProfessionals(): void {
    this.costAssistanceProfessionalLoading.set(true);

    this.opinionService.getCostAssistanceProfessionals()
      .pipe(finalize(() => {
        this.costAssistanceProfessionalLoading.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          if (response) {
            this.costAssistanceProfessionalOptions = response.map((item: any) => ({
              ...item?.patient,
              ...item
            }));
            this.setCostAssistanceProfessionalOptions();
            this.costAssistanceProfessionalReadOnly.set(false);
            this.cdr.markForCheck();
          }
        },
        error: () => {
          this.costAssistanceProfessionalReadOnly.set(true);
        }
      });
  }

  protected getTravelProfessionals(): void {
    this.travelProfessionalLoading.set(true);

    this.opinionService.getTravelProfessionals()
      .pipe(finalize(() => {
        this.travelProfessionalLoading.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          if (response) {
            this.travelProfessionalOptions = response.map((item: any) => ({
              ...item?.patient,
              ...item
            }));
            this.setTravelProfessionalOptions();
            this.travelProfessionalReadOnly.set(false);
            this.cdr.markForCheck();
          }
        },
        error: () => {
          this.travelProfessionalReadOnly.set(true);
        }
      });
  }

  protected setCostAssistanceProfessional(option: any): void {
    this.tramitPatientRequestForm.get('cost_assistance_professional_id')?.setValue(option.id);
    this.tramitPatientRequestForm.markAsDirty();
  }

  protected setTravelProfessional(option: any): void {
    this.tramitPatientRequestForm.get('travel_professional_id')?.setValue(option.id);
    this.tramitPatientRequestForm.markAsDirty();
  }

  protected onSubmit(): void {
    if (this.tramitPatientRequestForm.invalid) {
      this.tramitPatientRequestForm.markAllAsTouched();
      this.costAssistanceProfessionalControl.markAsTouched();
      return;
    }

    const requestId = this.data?.patient_request?.id;
    if (!requestId) {
      this.messageService.showMessage('Erro: Identificador da solicitação não encontrado.');
      return;
    }

    this.isSubmitting.set(true);

    this.opinionService.processPatientRequestToCostAssistanceAndTravel(requestId, this.tramitPatientRequestForm.getRawValue())
      .pipe(finalize(() => {
        this.isSubmitting.set(false);
        this.cdr.markForCheck();
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