import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ERRORS } from '../../../consts/errors';
import { MessageService } from '../../../../core/services/message-service';
import { HospitalUnityService } from '../../../services/hospital-unity-service';

@Component({
  selector: 'app-create-hospital-unity-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './create-hospital-unity-component.html',
  styleUrl: './create-hospital-unity-component.scss',
})
export class CreateHospitalUnityComponent {

  createHospitalUnityForm: FormGroup;
  errorMessages = ERRORS

  constructor(
    private formBuilder: FormBuilder,
    private hospitalUnityService: HospitalUnityService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<CreateHospitalUnityComponent>,
  ) {
    this.createHospitalUnityForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      cnes: [null, [Validators.required]],
    });
  }

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true)
    this.hospitalUnityService.createHospitalUnity(this.createHospitalUnityForm.value).subscribe({
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
