import { ChangeDetectionStrategy, Component, DestroyRef, Injector, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

// Core & Models
import { MessageService } from '../../../../core/services/message-service';
import { Ufs } from '../../../enums/ufs'; // Ajuste o caminho do import conforme seu projeto

// Services, Enums & Local Components
import { HospitalUnityService } from '../../../services/hospital-unity-service';

@Component({
  selector: 'app-create-hospital-unity-component',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './create-hospital-unity-component.html',
  styleUrl: './create-hospital-unity-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateHospitalUnityComponent implements OnInit {
  // ==========================================
  // Injeção de Dependências
  // ==========================================
  protected readonly data = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly fb = inject(FormBuilder);
  private readonly hospitalUnityService = inject(HospitalUnityService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<CreateHospitalUnityComponent>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  // ==========================================
  // Propriedades e Estado Reativo
  // ==========================================
  protected createHospitalUnityForm!: FormGroup;
  protected readonly ufs: string[] = Object.values(Ufs);
  protected readonly isSubmitting = signal<boolean>(false);

  // Mapeamento de Mensagens de Erro Tipado
  protected readonly errorMessages: Record<string, Array<{ type: string; message: string }>> = {
    name: [{ type: 'required', message: 'O nome é obrigatório.' }],
    cnes: [{ type: 'required', message: 'O CNES é obrigatório.' }],
    city: [{ type: 'required', message: 'A cidade é obrigatória.' }],
    state: [{ type: 'required', message: 'Selecione a UF.' }]
  };

  // ==========================================
  // Ciclo de Vida (Hooks)
  // ==========================================
  ngOnInit(): void {
    this.initForm();
    this.setupFormSubmittingHandler();
  }

  // ==========================================
  // Métodos Acessíveis pelo Template
  // ==========================================
  protected onSubmit(): void {
    if (this.createHospitalUnityForm.invalid) {
      this.createHospitalUnityForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.hospitalUnityService.createHospitalUnity(this.createHospitalUnityForm.getRawValue())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Unidade hospitalar criada com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao criar unidade hospitalar.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }

  // ==========================================
  // Métodos Privados
  // ==========================================
  private initForm(): void {
    this.createHospitalUnityForm = this.fb.group({
      name: ['', [Validators.required]],
      cnes: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]]
    });
  }

  private setupFormSubmittingHandler(): void {
    toObservable(this.isSubmitting, { injector: this.injector })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isSubmitting => {
        if (isSubmitting) {
          this.createHospitalUnityForm.disable({ emitEvent: false });
        } else {
          this.createHospitalUnityForm.enable({ emitEvent: false });
        }
      });
  }
}