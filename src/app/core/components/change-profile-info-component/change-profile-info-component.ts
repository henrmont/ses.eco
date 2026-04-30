import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProfileService } from '../../services/profile-service';
import { MessageService } from '../../services/message-service';

@Component({
  selector: 'app-change-profile-info-component',
  imports: [FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './change-profile-info-component.html',
  styleUrl: './change-profile-info-component.scss',
})
export class ChangeProfileInfoComponent {

  data = inject(MAT_DIALOG_DATA)
  changeProfileInfoForm: FormGroup 

  constructor(
    private formBuilder: FormBuilder,
    private profileService: ProfileService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<ChangeProfileInfoComponent>,
  ) {
    this.changeProfileInfoForm = this.formBuilder.group({
      id: [this.data.user.id, Validators.required],
      name: [this.data.user.name, Validators.required],
    });
  }

  wSubmit = signal<boolean>(false)
  onChangeProfileInfoSubmit(): any {
    this.wSubmit.set(true)
    this.profileService.changeProfileInfo(this.changeProfileInfoForm.value).subscribe({
      next: (response) => {
        this.messageService.showMessage(response.message)
        this.dialogRef.close(this.changeProfileInfoForm.get('name'))
      },
      error: (error) => {
        this.messageService.showMessage(error.error.message)
        this.wSubmit.set(false)
      },
    })
  }

}
