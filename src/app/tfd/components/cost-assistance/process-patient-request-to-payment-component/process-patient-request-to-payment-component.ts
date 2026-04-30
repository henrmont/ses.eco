import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { map, Observable, startWith } from 'rxjs';
import { MatChipsModule } from '@angular/material/chips';
import { ERRORS } from '../../../consts/errors';
import { MessageService } from '../../../../core/services/message-service';
import { OpinionService } from '../../../services/opinion-service';
import { CostAssistanceService } from '../../../services/cost-assistance-service';
import { Archive } from '../../../models/archive';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-process-patient-request-to-payment-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatProgressSpinnerModule, MatChipsModule, MatListModule, MatSlideToggleModule],
  templateUrl: './process-patient-request-to-payment-component.html',
  styleUrl: './process-patient-request-to-payment-component.scss',
})
export class ProcessPatientRequestToPaymentComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  processPatientRequestForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private costAssistanceService: CostAssistanceService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<ProcessPatientRequestToPaymentComponent>,
  ) {
    this.processPatientRequestForm = this.formBuilder.group({
      payment_professional_id: [null, [Validators.required]],
      archives: [[]]
    });
  }

  ngOnInit(): void {
    this.getPaymentProfessionals()
  }

  toggleArchive(item: Archive) {
    let archives = this.processPatientRequestForm.get('archives')?.value
    const index = archives.indexOf(item.id)
    if (archives.includes(item.id)) {
      if (index !== -1) {
        archives.splice(index, 1)
      }
    } else {
      archives.push(item.id)
    }
  }

  getPaymentProfessionals() {
    this.paymentProfessionalLoading.set(true)
    this.costAssistanceService.getPaymentProfessionals().subscribe({
      next: (response) => {
        this.paymentProfessionalOptions = response.map((item: any) => {return {...item.patient, ...item}})
        this.setPaymentProfessionalOptions()
      },
      complete: () => {
        this.paymentProfessionalLoading.set(false)
        this.paymentProfessionalReadOnly.set(false)
      }
    })
  }
  paymentProfessionalControl = new FormControl<string | any>('', Validators.required);
  paymentProfessionalOptions!: any[];
  filteredPaymentProfessionalOptions!: Observable<any[]>;
  paymentProfessionalReadOnly = signal<boolean>(true)
  paymentProfessionalLoading = signal<boolean>(false)
  setPaymentProfessionalOptions() {
    this.filteredPaymentProfessionalOptions = this.paymentProfessionalControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterPaymentProfessional(name as string) : this.paymentProfessionalOptions.slice();
      }),
    );
  }
  onPaymentProfessionalSelected(option: any) {
    if (option && option.id) {
      this.processPatientRequestForm.patchValue({
        payment_professional_id: option.id
      });
    }
  }
  private _filterPaymentProfessional(name: string): any[] {
    const FILTER_VALUE = name.toLowerCase();

    return this.paymentProfessionalOptions.filter(option => option.name.toLowerCase().includes(FILTER_VALUE));
  }
  displayPaymentProfessional(paymentProfessional: any): string {
    return paymentProfessional && paymentProfessional.name ? paymentProfessional.name : '';
  }
  
  wSubmit = signal<boolean>(false)
  onTramitPatientRequestSubmit() {
    this.wSubmit.set(true);
    this.costAssistanceService.processPatientRequestToPayment(this.data.patient_request.id, this.processPatientRequestForm.value).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message)
        this.dialogRef.close(true)
      },
      error: (err) => {
        this.messageService.showMessage(err.error.message)
        this.wSubmit.set(false);
      },
    })
  }

}
