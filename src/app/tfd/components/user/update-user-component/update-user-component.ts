import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { NgxMaskDirective } from 'ngx-mask';
import { ERRORS } from '../../../consts/errors';
import { UserService } from '../../../services/user-service';
import { MessageService } from '../../../../core/services/message-service';
import { CustomValidators } from '../../../../core/validators/custom.validator';
import { Professionals } from '../../../enums/professionals';

@Component({
  selector: 'app-update-user-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatProgressSpinnerModule, NgxMaskDirective],
  templateUrl: './update-user-component.html',
  styleUrl: './update-user-component.scss',
})
export class UpdateUserComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA);
  updateUserForm: FormGroup;
  errorMessages = ERRORS

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<UpdateUserComponent>,
  ) {
    this.updateUserForm = this.formBuilder.group({
      email: [this.data.user.email, [Validators.required, Validators.email],[this.userService.emailUserExistsValidator(this.data.user.email)]],
      name: [this.data.user.professional ? this.data.user.professional.name : null, [Validators.required]],
      type: [this.data.user.professional ? this.data.user.professional.type : null, [Validators.required]],
      cns: [this.data.user.professional ? this.data.user.professional.cns : null, [Validators.required, CustomValidators.cnsValidator()],[this.userService.cnsUserExistsValidator(this.data.user.professional ? this.data.user.professional.cns : null)]],
      registration: [this.data.user.professional ? this.data.user.professional.registration : null, [Validators.required]],
      professional_register: [this.data.user.professional ? this.data.user.professional.professional_register : null],
      cbo: [this.data.user.professional ? this.data.user.professional.cbo : null],
    });
    effect(() => {
      if (this.medicalType())
        this.updateUserForm.get('cbo')?.disable();
      else
        this.updateUserForm.get('cbo')?.enable();

      if (this.socialType() && this.medicalType())
        this.updateUserForm.get('professional_register')?.disable();
      else
        this.updateUserForm.get('professional_register')?.enable();
    })
  }

  ngOnInit() {
    this.setMedicalType(this.data.user.professional ? this.data.user.professional.type : null)
    this.setSocialType(this.data.user.professional ? this.data.user.professional.type : null)
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
    this.updateUserForm.get('cbo')?.reset();
  }

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true)
    this.userService.updateUser(this.data.user.id, this.updateUserForm.value).subscribe({
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
