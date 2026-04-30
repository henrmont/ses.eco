import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatChipsModule} from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { ERRORS } from '../../../consts/errors';
import { MessageService } from '../../../../core/services/message-service';
import { Transportation } from '../../../enums/transportation';
import { TravelType } from '../../../enums/travel-type';
import { TravelService } from '../../../services/travel-service';

@Component({
  selector: 'app-update-travel-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatProgressSpinnerModule, MatDatepickerModule, MatChipsModule, MatSelectModule],
  templateUrl: './update-travel-component.html',
  styleUrl: './update-travel-component.scss',
})
export class UpdateTravelComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  createTravelForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private travelService: TravelService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<UpdateTravelComponent>,
  ) {
    this.createTravelForm = this.formBuilder.group({
      transportation: [this.data.travel.transportation, [Validators.required]],
      type: [this.data.travel.type],
      origin: [this.data.travel.origin],
      destination: [this.data.travel.destination],
      departure_date: [this.data.travel.departure_date],
      return_date: [this.data.travel.return_date],
      description: [this.data.travel.description],
      os: [this.data.travel.os],
      locator: [this.data.travel.locator],
    });
    effect(() => {
      if (this.departure()) {
        this.createTravelForm.get('departure_date')?.disable();
        this.createTravelForm.get('departure_date')?.setValue(null);
        this.createTravelForm.get('departure_date')?.updateValueAndValidity();
      } else {
        this.createTravelForm.get('departure_date')?.enable();
        this.createTravelForm.get('departure_date')?.updateValueAndValidity();
      }
      if (this.return()) {
        this.createTravelForm.get('return_date')?.disable();
        this.createTravelForm.get('return_date')?.setValue(null);
        this.createTravelForm.get('return_date')?.updateValueAndValidity();
      } else {
        this.createTravelForm.get('return_date')?.enable();
        this.createTravelForm.get('return_date')?.updateValueAndValidity();
      }
    })
  }

  ngOnInit(): void {
    this.setType(this.data.travel.type)
  }

  transportations: any[] = Object.values(Transportation)
  types: any[] = Object.values(TravelType)
  departure = signal<boolean>(true)
  return = signal<boolean>(true)
  onSelection(event: MatSelectChange) {
    this.setType(event.value)
  }
  setType(type: string) {
    if (type === 'Ida') {
      this.departure.set(false)
      this.return.set(true)
    }
    else if (type === 'Volta') {
      this.departure.set(true)
      this.return.set(false)
    }
    else {
      this.departure.set(false)
      this.return.set(false)
    }
  }
  
  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true)
    this.travelService.updateTravel(this.data.travel.id, this.createTravelForm.value).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message)
        this.dialogRef.close(true)
      },
      error: (err) => {
        this.messageService.showMessage(err.error.message)
        this.wSubmit.set(false)
      },
    })
  }

}
