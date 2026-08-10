import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
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
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly opinionService = inject(OpinionService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<ProcessPatientRequestToCostAssistanceAndTravelComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // 🎯 Mapeamento local das mensagens de erro padronizadas para a UI
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    cost_assistance_professional_control: [
      { type: 'required', message: 'A escolha de um profissional de ajuda de custo é obrigatória.' }
    ]
  };

  // Estrutura do Formulário e Controles expostos ao template
  protected processForm!: FormGroup;
  protected readonly costAssistanceProfessionalControl = new FormControl<string | any>('', [Validators.required]);
  protected readonly travelProfessionalControl = new FormControl<string | any>('');

  // Estados gerenciados reativamente via Signals (Ajuda de Custo)
  protected readonly costAssistanceProfessionalReadOnly = signal<boolean>(true);
  protected readonly costAssistanceProfessionalLoading = signal<boolean>(false);

  // Estados gerenciados reativamente via Signals (Viagem / TFD)
  protected readonly travelProfessionalReadOnly = signal<boolean>(true);
  protected readonly travelProfessionalLoading = signal<boolean>(false);
  
  // Estado global de submissão do diálogo
  protected readonly isSubmitting = signal<boolean>(false);

  // Listagens e Filtros de Autocomplete
  protected costAssistanceProfessionalOptions: any[] = [];
  protected filteredCostAssistanceProfessionalOptions!: Observable<any[]>;

  protected travelProfessionalOptions: any[] = [];
  protected filteredTravelProfessionalOptions!: Observable<any[]>;

  ngOnInit(): void {
    this.initForm();
    this.getCostAssistanceProfessionals();
    this.getTravelProfessionals();
    this.registerCleaners();
  }

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO E SUPORTE ---

  private initForm(): void {
    this.processForm = this.fb.group({
      cost_assistance_professional_id: [null, [Validators.required]],
      travel_professional_id: [null],
    });
  }

  /**
   * Monitora se o usuário limpou o texto do autocomplete para invalidar o formulário principal
   */
  private registerCleaners(): void {
    this.costAssistanceProfessionalControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!value) {
          this.processForm.get('cost_assistance_professional_id')?.setValue(null);
          this.processForm.get('cost_assistance_professional_id')?.markAsDirty();
          this.cdr.markForCheck();
        }
      });

    this.travelProfessionalControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!value) {
          this.processForm.get('travel_professional_id')?.setValue(null);
          this.processForm.get('travel_professional_id')?.markAsDirty();
          this.cdr.markForCheck();
        }
      });
  }

  // --- FILTROS DE AJUDA DE CUSTO ---

  private setCostAssistanceProfessionalOptions(): void {
    this.filteredCostAssistanceProfessionalOptions = this.costAssistanceProfessionalControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterCostAssistance(name) : this.costAssistanceProfessionalOptions.slice(0, 10);
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private _filterCostAssistance(searchTerm: string): any[] {
    const filterValue = searchTerm.toLowerCase().trim();

    return this.costAssistanceProfessionalOptions
      .filter(option => option.name && option.name.toLowerCase().includes(filterValue))
      .slice(0, 10); // Limite de performance estrito
  }

  // --- FILTROS DE VIAGEM / TFD ---

  private setTravelProfessionalOptions(): void {
    this.filteredTravelProfessionalOptions = this.travelProfessionalControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterTravel(name) : this.travelProfessionalOptions.slice(0, 10);
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private _filterTravel(searchTerm: string): any[] {
    const filterValue = searchTerm.toLowerCase().trim();

    return this.travelProfessionalOptions
      .filter(option => option.name && option.name.toLowerCase().includes(filterValue))
      .slice(0, 10); // Limite de performance estrito
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
    this.cdr.markForCheck();

    this.opinionService.getCostAssistanceProfessionals()
      .pipe(
        finalize(() => {
          this.costAssistanceProfessionalLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
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
          this.costAssistanceProfessionalOptions = [];
          this.cdr.markForCheck();
        }
      });
  }

  protected getTravelProfessionals(): void {
    this.travelProfessionalLoading.set(true);
    this.cdr.markForCheck();

    this.opinionService.getTravelProfessionals()
      .pipe(
        finalize(() => {
          this.travelProfessionalLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
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
          this.travelProfessionalOptions = [];
          this.cdr.markForCheck();
        }
      });
  }

  protected onCostAssistanceProfessionalSelected(option: any): void {
    if (option?.id) {
      this.processForm.get('cost_assistance_professional_id')?.setValue(option.id);
      this.processForm.get('cost_assistance_professional_id')?.markAsDirty();
      this.cdr.markForCheck();
    }
  }

  protected onTravelProfessionalSelected(option: any): void {
    if (option?.id) {
      this.processForm.get('travel_professional_id')?.setValue(option.id);
      this.processForm.get('travel_professional_id')?.markAsDirty();
      this.cdr.markForCheck();
    }
  }

  protected onSubmit(): void {
    this.costAssistanceProfessionalControl.markAsTouched();

    if (this.processForm.invalid || this.costAssistanceProfessionalControl.invalid) {
      this.processForm.markAllAsTouched();
      return;
    }

    const requestId = this.data?.patient_request?.id;
    if (!requestId) {
      this.messageService.showMessage('Identificador da solicitação não encontrado.');
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    this.opinionService.processPatientRequestToCostAssistanceAndTravel(requestId, this.processForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
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