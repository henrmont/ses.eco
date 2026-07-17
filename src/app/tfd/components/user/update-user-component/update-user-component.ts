import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgxMaskDirective } from 'ngx-mask';
import { UserService } from '../../../services/user-service';
import { MessageService } from '../../../../core/services/message-service';
import { Professionals } from '../../../enums/professionals';

@Component({
  selector: 'app-update-user-component',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
    NgxMaskDirective
  ],
  templateUrl: './update-user-component.html',
  styleUrl: './update-user-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateUserComponent implements OnInit {
  // Injeções de Dependência Dinâmicas
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdateUserComponent>);
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
    this.loadInitialPermissions();
  }

  private initForm(): void {
    const professional = this.data?.user?.professional;
    const initialEmail = this.data?.user?.email || null;
    const initialCns = professional ? professional.cns : null;

    this.userForm = this.fb.group({
      name: [professional ? professional.name : '', [Validators.required]],
      email: [
        initialEmail, 
        [Validators.required, Validators.email], 
        [this.userService.emailUserExistsValidator(initialEmail)]
      ],
      type: [professional ? professional.type : '', [Validators.required]],
      cns: [
        initialCns, 
        [Validators.required], 
        [this.userService.cnsUserExistsValidator(initialCns)]
      ],
      registration: [professional ? professional.registration : '', [Validators.required]],
      professional_register: [{ value: professional ? professional.professional_register : '', disabled: true }],
      cbo: [{ value: professional ? professional.cbo : '', disabled: true }]
    });
  }

  /**
   * Executa a checagem das travas de campos baseada no tipo que o usuário 
   * já possuía cadastrado antes da abertura do modal.
   */
  private loadInitialPermissions(): void {
    const initialType = this.userForm.get('type')?.value;
    if (initialType) {
      this.evaluateProfessionalControls(initialType);
      this.userForm.updateValueAndValidity();
      this.cdr.markForCheck();
    }
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
    this.userForm.markAsDirty();
    this.userForm.updateValueAndValidity();
  }

  protected onSubmit(): void {
    const userId = this.data?.user?.id;
    if (!userId) {
      this.messageService.showMessage('Identificador do usuário inválido.');
      return;
    }

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.cdr.markForCheck();

    // Envia o ID original do usuário e a árvore completa de dados modificados
    this.userService.updateUser(userId, this.userForm.getRawValue())
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.showMessage(response?.message || 'Usuário atualizado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          const fallbackError = 'Erro ao atualizar o usuário.';
          this.messageService.showMessage(err?.error?.message || fallbackError);
        }
      });
  }
}