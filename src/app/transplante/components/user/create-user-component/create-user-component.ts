import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMaskDirective } from 'ngx-mask';
import { ERRORS } from '../../../consts/errors';
import { UserService } from '../../../services/user-service';
import { MessageService } from '../../../../core/services/message-service';
import { Professionals } from '../../../enums/professionals';

@Component({
  selector: 'app-create-user-component',
  imports: [
    CommonModule, 
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
  changeDetection: ChangeDetectionStrategy.OnPush, // ⚡ Performance máxima com OnPush
})
export class CreateUserComponent {
  // Injeção moderna de dependências
  protected readonly data = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<CreateUserComponent>);

  readonly errorMessages = ERRORS;
  readonly types: string[] = Object.values(Professionals);
  
  // Estado reativo do formulário e envio
  readonly isLoading = signal<boolean>(false);
  readonly selectedProfessionalType = signal<string>('');

  readonly createUserForm: FormGroup;

  constructor() {
    // Inicialização limpa do FormGroup
    this.createUserForm = this.fb.group({
      email: [null, [Validators.required, Validators.email], [this.userService.emailUserExistsValidator(null)]],
      name: [null, [Validators.required]],
      type: [null, [Validators.required]],
      cns: [null, [Validators.required]],
      registration: [null, [Validators.required]],
    });

    // Reatividade declarativa baseada no tipo selecionado
    effect(() => {
      const type = this.selectedProfessionalType();
      const isMedico = type === 'Médico';
      const isAssistenteSocial = type === 'Assistente Social';

      // CBO fica desabilitado apenas se for Médico
      if (isMedico) {
        this.createUserForm.get('cbo')?.disable();
      } else {
        this.createUserForm.get('cbo')?.enable();
      }

      // Registro Profissional fica desabilitado se for Assistente Social OU Médico
      if (isAssistenteSocial || isMedico) {
        this.createUserForm.get('professional_register')?.disable();
      } else {
        this.createUserForm.get('professional_register')?.enable();
      }
    });
  }

  onSelection(event: MatSelectChange): void {
    this.selectedProfessionalType.set(event.value);
  }

  resetCBO(): void {
    this.createUserForm.get('cbo')?.reset();
  }

  onSubmit(): void {
    if (this.createUserForm.invalid) return;

    this.isLoading.set(true);
    
    // Passamos getRawValue() para enviar inclusive os campos que possam estar desabilitados, se necessário
    this.userService.createUser(this.createUserForm.getRawValue()).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message);
        this.dialogRef.close(true);
      },
      error: (err) => {
        const fallbackMessage = err?.error?.message || 'Erro ao criar o usuário';
        this.messageService.showMessage(fallbackMessage);
        this.isLoading.set(false);
      },
    });
  }
}