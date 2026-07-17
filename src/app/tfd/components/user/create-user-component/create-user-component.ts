import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgxMaskDirective } from 'ngx-mask';
import { UserService } from '../../../services/user-service';
import { MessageService } from '../../../../core/services/message-service';
import { Professionals } from '../../../enums/professionals';

@Component({
  selector: 'app-create-user-component',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    NgxMaskDirective
  ],
  templateUrl: './create-user-component.html',
  styleUrl: './create-user-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateUserComponent implements OnInit {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<CreateUserComponent>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Estrutura do Formulário exposta ao template
  protected userForm!: FormGroup;

  // Propriedades e Listagens estáticas de Enums
  protected readonly types: string[] = Object.values(Professionals);

  // Estados gerenciados reativamente via Signals
  protected readonly isSubmitting = signal<boolean>(false);

  // 🎯 Mapeamento local das mensagens de erro padronizado
  protected readonly errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    name: [{ type: 'required', message: 'O nome é obrigatório.' }],
    email: [
      { type: 'required', message: 'O e-mail é obrigatório.' },
      { type: 'email', message: 'Formato de e-mail inválido.' },
      { type: 'emailExists', message: 'O e-mail informado já está em uso.' }
    ],
    type: [{ type: 'required', message: 'Selecione o tipo de profissional.' }],
    cns: [
      { type: 'required', message: 'O CNS é obrigatório.' },
      { type: 'cnsExists', message: 'O CNS informado já está em uso.' }
    ],
    registration: [{ type: 'required', message: 'A matrícula é obrigatória.' }]
  };

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email], [this.userService.emailUserExistsValidator(null)]],
      type: ['', [Validators.required]],
      cns: ['', [Validators.required], [this.userService.cnsUserExistsValidator(null)]],
      registration: ['', [Validators.required]],
      professional_register: [{ value: '', disabled: true }],
      cbo: [{ value: '', disabled: true }]
    });
  }

  /**
   * Avalia o tipo de profissional selecionado e atualiza de forma síncrona 
   * o estado de habilitação dos controles de formulário correspondentes.
   */
  private evaluateProfessionalControls(selectedType: string): void {
    const isMedico = selectedType === Professionals.MEDICO;
    const isAssistenteSocial = selectedType === Professionals.ASSISTENTE_SOCIAL;

    const professionalRegisterCtrl = this.userForm.get('professional_register');
    const cboCtrl = this.userForm.get('cbo');

    // Regra para Registro Profissional (Médico ou Assistente Social)
    if (isMedico || isAssistenteSocial) {
      professionalRegisterCtrl?.enable();
    } else {
      professionalRegisterCtrl?.disable();
      professionalRegisterCtrl?.reset();
    }

    // Regra para CBO (Apenas Médico)
    if (isMedico) {
      cboCtrl?.enable();
    } else {
      cboCtrl?.disable();
      cboCtrl?.reset();
    }
  }

  // --- MÉTODOS DE AÇÃO DO TEMPLATE (PROTECTED) ---

  protected onSelection(event: MatSelectChange): void {
    this.evaluateProfessionalControls(event.value);
  }

  protected onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    // getRawValue garante que campos desabilitados por regras de negócio também sejam enviados
    this.userService.createUser(this.userForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Usuário cadastrado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao criar o usuário.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}