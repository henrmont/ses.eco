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

import { PatientRequestOpinionService } from '../../../services/patient-request-opinion.service';
import { MessageService } from '../../../../core/services/message-service';

@Component({
  selector: 'app-patient-request-process-to-social',
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
  templateUrl: './patient-request-process-to-social.component.html',
  styleUrl: './patient-request-process-to-social.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Performance máxima com OnPush + Signals
})
export class PatientRequestProcessToSocialComponent implements OnInit {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly opinionService = inject(PatientRequestOpinionService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<PatientRequestProcessToSocialComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // 🎯 Mapeamento local das mensagens de erro padronizadas para a UI
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    social_professional_control: [
      { type: 'required', message: 'A escolha de um profissional social é obrigatória.' }
    ]
  };

  // Estrutura do Formulário e Controles expostos ao template
  protected processForm!: FormGroup;
  protected readonly socialProfessionalControl = new FormControl<string | any>('', [Validators.required]);

  // Estados gerenciados reativamente via Signals
  protected readonly socialProfessionalReadOnly = signal<boolean>(true);
  protected readonly socialProfessionalLoading = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);

  // Listagem e Filtros de Autocomplete
  protected socialProfessionalOptions: any[] = [];
  protected filteredSocialProfessionalOptions!: Observable<any[]>;

  ngOnInit(): void {
    this.initForm();
    this.getSocialProfessionals();
    this.registerCleaners();
  }

  // --- MÉTODOS PRIVADOS DE INICIALIZAÇÃO E SUPORTE ---

  private initForm(): void {
    this.processForm = this.fb.group({
      social_professional_id: [null, [Validators.required]],
    });
  }

  /**
   * Monitora se o usuário limpou o texto do autocomplete para invalidar o formulário principal
   */
  private registerCleaners(): void {
    this.socialProfessionalControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!value) {
          this.processForm.get('social_professional_id')?.setValue(null);
          this.processForm.get('social_professional_id')?.markAsDirty();
          this.cdr.markForCheck();
        }
      });
  }

  private setSocialProfessionalOptions(): void {
    this.filteredSocialProfessionalOptions = this.socialProfessionalControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterSocialProfessional(name) : this.socialProfessionalOptions.slice(0, 10);
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private _filterSocialProfessional(searchTerm: string): any[] {
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
    this.cdr.markForCheck();

    this.opinionService.getSocialProfessionals()
      .pipe(
        finalize(() => {
          this.socialProfessionalLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
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
          this.socialProfessionalOptions = [];
          this.cdr.markForCheck();
        }
      });
  }

  protected onSocialProfessionalSelected(option: any): void {
    if (option?.id) {
      this.processForm.get('social_professional_id')?.setValue(option.id);
      this.processForm.get('social_professional_id')?.markAsDirty();
      this.cdr.markForCheck();
    }
  }

  protected onSubmit(): void {
    this.socialProfessionalControl.markAsTouched();

    if (this.processForm.invalid || this.socialProfessionalControl.invalid) {
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

    this.opinionService.processPatientRequestToSocial(requestId, this.processForm.getRawValue())
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