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
  selector: 'app-create-route-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './create-route-component.html',
  styleUrl: './create-route-component.scss',
})
export class CreateRouteComponent {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  createReportForm: FormGroup 

  constructor(
    private formBuilder: FormBuilder,
    private travelService: TravelService,
    private messageService: MessageService,
    private dialog: MatDialogRef<CreateRouteComponent>,
  ) {
    this.createReportForm = this.formBuilder.group({
      origin: [null, [Validators.required]],
      destination: [null, [Validators.required]],
      distance: [null],
    });
  }

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true);
    this.travelService.createRoute(this.data.travel.id, this.createReportForm.value).subscribe({
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
