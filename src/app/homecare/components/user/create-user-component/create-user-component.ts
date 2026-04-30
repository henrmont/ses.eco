import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMaskDirective } from 'ngx-mask';
import { ERRORS } from '../../../consts/errors';
import { UserService } from '../../../services/user-service';
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';
import { Professionals } from '../../../enums/professionals';

@Component({
  selector: 'app-create-user-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, NgxMaskDirective],
  templateUrl: './create-user-component.html',
  styleUrl: './create-user-component.scss',
})
export class CreateUserComponent {

  data = inject(MAT_DIALOG_DATA);
  createUserForm: FormGroup;
  errorMessages = ERRORS

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<CreateUserComponent>,
  ) {
    this.createUserForm = this.formBuilder.group({
      email: [null, [Validators.required, Validators.email],[this.userService.emailUserExistsValidator(null)]],
      name: [null, [Validators.required]],
      type: [null, [Validators.required]],
      cns: [null, [Validators.required]],
      // cns: [null, [Validators.required, CustomValidators.cnsValidator()],[this.userService.cnsUserExistsValidator(null)]],
      registration: [null, [Validators.required]],
      professional_register: [null],
      cbo: [null],
    });
    effect(() => {
      if (this.medicalType())
        this.createUserForm.get('cbo')?.disable();
      else
        this.createUserForm.get('cbo')?.enable();

      if (this.socialType() && this.medicalType())
        this.createUserForm.get('professional_register')?.disable();
      else
        this.createUserForm.get('professional_register')?.enable();
    })
  }

  types: any[] = Object.values(Professionals)
  onSelection(event: MatSelectChange) {
    this.setMedicalType(event.value)
    this.setSocialType(event.value)
  }

  medicalType = signal<boolean>(true);
  setMedicalType(type: string) {
    if (type === 'Médico')
      this.medicalType.set(false)
    else
      this.medicalType.set(true);
  }

  socialType = signal<boolean>(true);
  setSocialType(type: string) {
    if (type === 'Assistente Social')
      this.socialType.set(false)
    else
        this.socialType.set(true);
  }

  resetCBO() {
    this.createUserForm.get('cbo')?.reset();
  }

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true)
    this.userService.createUser(this.createUserForm.value).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.messageService.showMessage(err.error.message);
        this.wSubmit.set(false)
      },
    })
  }

}
