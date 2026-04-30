import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { ERRORS } from '../../../consts/errors';
import { MessageService } from '../../../../core/services/message-service';
import { TravelService } from '../../../services/travel-service';

@Component({
  selector: 'app-update-route-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './update-route-component.html',
  styleUrl: './update-route-component.scss',
})
export class UpdateRouteComponent {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  createReportForm: FormGroup 

  constructor(
    private formBuilder: FormBuilder,
    private travelService: TravelService,
    private messageService: MessageService,
    private dialog: MatDialogRef<UpdateRouteComponent>,
  ) {
    this.createReportForm = this.formBuilder.group({
      origin: [this.data.route.origin, [Validators.required]],
      destination: [this.data.route.destination, [Validators.required]],
      distance: [this.data.route.distance],
    });
  }

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true);
    this.travelService.updateRoute(this.data.route.id, this.createReportForm.value).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message);
        this.dialog.close(true);
      },
      error: (err) => {
        this.messageService.showMessage(err.error.message);
        this.wSubmit.set(false);
      }
    });
  }

}
