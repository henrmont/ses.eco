import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ImageCroppedEvent, ImageCropperComponent, LoadedImage } from 'ngx-image-cropper';
import { ProfileService } from '../../services/profile-service';
import { MessageService } from '../../services/message-service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-change-profile-image-component',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule, ImageCropperComponent],
  templateUrl: './change-profile-image-component.html',
  styleUrl: './change-profile-image-component.scss',
})
export class ChangeProfileImageComponent {

  data = inject(MAT_DIALOG_DATA)
  changeProfileImageForm: FormGroup 

  constructor(
    private formBuilder: FormBuilder,
    private profileService: ProfileService,
    private messageService: MessageService,
    private dialog: MatDialogRef<ChangeProfileImageComponent>,
  ) {
    this.changeProfileImageForm = this.formBuilder.group({
      id: [this.data.user.id, Validators.required],
      image: [null, Validators.required],
    });
  }

  imageChangedEvent: any = this.data.event;
  croppedImage: any = '';

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64
    this.changeProfileImageForm.patchValue({
      image: this.croppedImage
    })
  }

  imageLoaded(image: LoadedImage) {
      // show cropper
  }

  cropperReady() {
      // cropper ready
  }

  loadImageFailed() {
      // show message
  }

  wSubmit = signal<boolean>(false)
  onChangeImageSubmit(): any {
    this.wSubmit.set(true)
    this.profileService.changeProfileImage(this.changeProfileImageForm.value).subscribe({
      next: (response) => {
        this.messageService.showMessage(response.message)
        this.dialog.close(this.changeProfileImageForm.get('image'))
      },
      error: (error) => {
        this.messageService.showMessage(error.error.message)
        this.wSubmit.set(false)
      },
    })
  }

}
