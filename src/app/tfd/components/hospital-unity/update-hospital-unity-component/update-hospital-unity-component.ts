import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ERRORS } from '../../../consts/errors';
import { MessageService } from '../../../../core/services/message-service';
import { HospitalUnityService } from '../../../services/hospital-unity-service';

@Component({
  selector: 'app-update-hospital-unity-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './update-hospital-unity-component.html',
  styleUrl: './update-hospital-unity-component.scss',
})
export class UpdateHospitalUnityComponent {

  data = inject(MAT_DIALOG_DATA);
  updateHospitalUnityForm: FormGroup;
  errorMessages = ERRORS

  constructor(
    private formBuilder: FormBuilder,
    private hospitalUnityService: HospitalUnityService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<UpdateHospitalUnityComponent>,
  ) {
    this.updateHospitalUnityForm = this.formBuilder.group({
      name: [this.data.hospital_unity.name, [Validators.required]],
      cnes: [this.data.hospital_unity.cnes, [Validators.required]],
    });
  }

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true)
    this.hospitalUnityService.updateHospitalUnity(this.data.hospital_unity.id, this.updateHospitalUnityForm.value).subscribe({
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
