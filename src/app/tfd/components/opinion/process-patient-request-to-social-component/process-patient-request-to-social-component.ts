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
  selector: 'app-process-patient-request-to-social-component',
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
  templateUrl: './process-patient-request-to-social-component.html',
  styleUrl: './process-patient-request-to-social-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class ProcessPatientRequestToSocialComponent implements OnInit {
  // Injeções de Dependência via inject()
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly opinionService = inject(OpinionService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<ProcessPatientRequestToSocialComponent>);
  private readonly cdr = inject(ChangeDetectorRef);

  // Mapeamento local das mensagens de erro (idêntico ao modelo de referência)
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    social_professional_id: [
      { type: 'required', message: 'A escolha de um profissional social é obrigatória.' }
    ]
  };

  // Formulário e Controles expostos ao template
  protected tramitPatientRequestForm!: FormGroup;
  protected readonly socialProfessionalControl = new FormControl<string | any>('');

  // Estados reativos com Signals
  protected readonly socialProfessionalReadOnly = signal<boolean>(true);
  protected readonly socialProfessionalLoading = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);

  // Filtros e opções do Autocomplete
  protected socialProfessionalOptions: any[] = [];
  protected filteredSocialProfessionalOptions!: Observable<any[]>;

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.getSocialProfessionals();
  }

  // --- MÉTODOS PRIVADOS DE SUPORTE ---

  private initForm(): void {
    this.tramitPatientRequestForm = this.fb.group({
      social_professional_id: [null, [Validators.required]],
    });
  }

  private setSocialProfessionalOptions(): void {
    this.filteredSocialProfessionalOptions = this.socialProfessionalControl.valueChanges.pipe(
      startWith(this.socialProfessionalControl.value),
      map(value => {
        if (value && typeof value === 'object') {
          return this._filterSocialProfessional(value.name || '');
        }
        return value ? this._filterSocialProfessional(value as string) : this.socialProfessionalOptions.slice(0, 10);
      })
    );
  }

  private _filterSocialProfessional(searchTerm: string): any[] {
    if (!searchTerm) {
      return this.socialProfessionalOptions.slice(0, 10);
    }

    const filterValue = searchTerm.toLowerCase().trim();

    return this.socialProfessionalOptions
      .filter(option => option.name && option.name.toLowerCase().includes(filterValue))
      .slice(0, 10); // Limite de performance estrito
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected displaySocialProfessional(socialProfessional: any): string {
    return socialProfessional?.name || '';
  }

  protected getSocialProfessionals(): void {
    this.socialProfessionalLoading.set(true);

    this.opinionService.getSocialProfessionals()
      .pipe(finalize(() => {
        this.socialProfessionalLoading.set(false);
        this.cdr.markForCheck(); // Sincroniza view após stream assíncrona
      }))
      .subscribe({
        next: (response) => {
          if (response) {
            this.socialProfessionalOptions = response.map((item: any) => ({
              ...item?.patient,
              ...item
            }));
            
            this.setSocialProfessionalOptions();
            this.socialProfessionalReadOnly.set(false);
            this.cdr.markForCheck();
          }
        },
        error: () => {
          this.socialProfessionalReadOnly.set(true);
        }
      });
  }

  protected setSocialProfessional(option: any): void {
    this.tramitPatientRequestForm.get('social_professional_id')?.setValue(option.id);
    this.tramitPatientRequestForm.markAsDirty();
  }

  protected onSubmit(): void {
    if (this.tramitPatientRequestForm.invalid) {
      this.tramitPatientRequestForm.markAllAsTouched();
      this.socialProfessionalControl.markAsTouched();
      return;
    }

    const requestId = this.data?.patient_request?.id;
    if (!requestId) {
      this.messageService.showMessage('Erro: Identificador da solicitação não encontrado.');
      return;
    }

    this.isSubmitting.set(true);

    this.opinionService.processPatientRequestToSocial(requestId, this.tramitPatientRequestForm.getRawValue())
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