import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { finalize } from 'rxjs';
import { UserService } from '../../../services/user-service';
import { MessageService } from '../../../../core/services/message-service';
import { Professionals } from '../../../enums/professionals';

@Component({
  selector: 'app-update-user-component',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    NgxMaskDirective,
    NgxMaskPipe
  ],
  templateUrl: './update-user-component.html',
  styleUrls: ['./update-user-component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Otimização de performance com OnPush
})
export class UpdateUserComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly dialogRef = inject(MatDialogRef<UpdateUserComponent>);
  
  // 🔒 Encapsulamento corrigido para imutabilidade e escopo de template
  protected readonly data = inject(MAT_DIALOG_DATA);

  updateUserForm!: FormGroup;
  readonly isSubmitting = signal<boolean>(false);

  types: string[] = Object.values(Professionals);

  errorMessages: { [key: string]: Array<{ type: string; message: string }> } = {
    name: [{ type: 'required', message: 'O nome é obrigatório.' }],
    type: [{ type: 'required', message: 'Selecione o tipo de profissional.' }],
    cns: [
      { type: 'required', message: 'O CNS é obrigatório.' },
      { type: 'cnsExists', message: 'Este CNS já está cadastrado.' }
    ],
    registration: [{ type: 'required', message: 'A matrícula é obrigatória.' }],
    professional_register: [{ type: 'required', message: 'O registro profissional é obrigatório.' }],
    cbo: [{ type: 'required', message: 'O CBO é obrigatório.' }]
  };

  constructor() {
    const professional = this.data?.user?.professional;
    const initialCns = professional ? professional.cns : null;

    this.updateUserForm = this.fb.group({
      email: [this.data?.user?.email, [Validators.required, Validators.email]],
      name: [professional ? professional.name : '', Validators.required],
      type: [professional ? professional.type : '', Validators.required],
      cns: [
        initialCns, 
        [Validators.required], 
        [this.userService.cnsUserExistsValidator(initialCns)]
      ],
      registration: [professional ? professional.registration : '', Validators.required],
      professional_register: [{ value: professional ? professional.professional_register : '', disabled: true }, Validators.required],
      cbo: [{ value: professional ? professional.cbo : '', disabled: true }, Validators.required]
    });

    // 🌟 Lógica de checagem inicial movida para o constructor, eliminando o OnInit
    const initialType = this.updateUserForm.get('type')?.value;
    if (initialType) {
      this.checkPermissions(initialType);
    }
    
    this.updateUserForm.updateValueAndValidity();
  }

  onSelection(event: MatSelectChange): void {
    this.checkPermissions(event.value);
    this.updateUserForm.markAsDirty();
    this.updateUserForm.updateValueAndValidity();
  }

  private checkPermissions(tipoSelecionado: string): void {
    const isMedico = tipoSelecionado === Professionals.MEDICO;
    const isAssistenteSocial = tipoSelecionado === Professionals.ASSISTENTE_SOCIAL;

    if (isMedico || isAssistenteSocial) {
      this.updateUserForm.get('professional_register')?.enable();
    } else {
      this.updateUserForm.get('professional_register')?.disable();
      this.updateUserForm.get('professional_register')?.reset();
    }

    if (isMedico) {
      this.updateUserForm.get('cbo')?.enable();
    } else {
      this.updateUserForm.get('cbo')?.disable();
      this.resetCBO();
    }
  }

  resetCBO(): void {
    this.updateUserForm.get('cbo')?.reset();
  }

  onSubmit(): void {
    if (this.updateUserForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    const formData = this.updateUserForm.getRawValue();

    this.userService.updateUser(this.data.user.id, formData)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (res: any) => {
          this.messageService.showMessage(res.message || 'Usuário atualizado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err: any) => {
          const errMsg = err?.error?.message || 'Erro ao atualizar o usuário';
          this.messageService.showMessage(errMsg);
        }
      });
  }
}