import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMaskDirective } from 'ngx-mask';
import { finalize } from 'rxjs';
import { UserService } from '../../../services/user-service';
import { MessageService } from '../../../../core/services/message-service';
import { Professionals } from '../../../enums/professionals';

@Component({
  selector: 'app-create-user-component',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    NgxMaskDirective,
  ],
  templateUrl: './create-user-component.html',
  styleUrls: ['./create-user-component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush, // ⚡ Performance otimizada com OnPush
})
export class CreateUserComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<CreateUserComponent>);
  protected readonly data = inject(MAT_DIALOG_DATA);

  createUserForm!: FormGroup;
  readonly isSubmitting = signal<boolean>(false);

  // 🌟 Converte os valores do Enum em uma lista de strings para o select do HTML
  types: string[] = Object.values(Professionals);

  errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    name: [{ type: 'required', message: 'O nome é obrigatório.' }],
    email: [
      { type: 'required', message: 'O e-mail é obrigatório.' },
      { type: 'email', message: 'Formato de e-mail inválido.' }
    ],
    type: [{ type: 'required', message: 'Selecione o tipo de profissional.' }],
    cns: [{ type: 'required', message: 'O CNS é obrigatório.' }],
    registration: [{ type: 'required', message: 'A matrícula é obrigatória.' }]
  };

  constructor() {
    this.createUserForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      type: ['', Validators.required],
      cns: ['', Validators.required],
      registration: ['', Validators.required],
      professional_register: [{ value: '', disabled: true }],
      cbo: [{ value: '', disabled: true }]
    });
  }

  onSelection(event: MatSelectChange): void {
    const tipoSelecionado = event.value;

    // 🌟 Comparação segura utilizando os valores definidos no Enum
    const isMedico = tipoSelecionado === Professionals.MEDICO;
    const isAssistenteSocial = tipoSelecionado === Professionals.ASSISTENTE_SOCIAL;

    // REGRA: Registro Profissional habilita apenas para Médico ou Assistente Social
    if (isMedico || isAssistenteSocial) {
      this.createUserForm.get('professional_register')?.enable();
    } else {
      this.createUserForm.get('professional_register')?.disable();
      this.createUserForm.get('professional_register')?.reset();
    }

    // REGRA: CBO habilita apenas para Médico
    if (isMedico) {
      this.createUserForm.get('cbo')?.enable();
    } else {
      this.createUserForm.get('cbo')?.disable();
      this.resetCBO();
    }
  }

  resetCBO(): void {
    this.createUserForm.get('cbo')?.reset();
  }

  onSubmit(): void {
    if (this.createUserForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    const formData = this.createUserForm.getRawValue();

    this.userService.createUser(formData)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (res: any) => {
          this.messageService.showMessage(res.message || 'Usuário cadastrado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err: any) => {
          const errMsg = err?.error?.message || 'Erro ao criar o usuário';
          this.messageService.showMessage(errMsg);
        }
      });
  }
}