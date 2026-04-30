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

@Component({
  selector: 'app-process-patient-request-to-cost-assistance-and-travel-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatProgressSpinnerModule, MatChipsModule],
  templateUrl: './process-patient-request-to-cost-assistance-and-travel-component.html',
  styleUrl: './process-patient-request-to-cost-assistance-and-travel-component.scss',
})
export class ProcessPatientRequestToCostAssistanceAndTravelComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  processPatientRequestForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private opinionService: OpinionService,
    private messageService: MessageService,
    private dialogRef: MatDialogRef<ProcessPatientRequestToCostAssistanceAndTravelComponent>,
  ) {
    this.processPatientRequestForm = this.formBuilder.group({
      cost_assistance_professional_id: [null, [Validators.required]],
      travel_professional_id: [null],
    });
  }

  ngOnInit(): void {
    this.getCostAssistanceProfessionals()
    this.getTravelProfessionals()
  }

  getCostAssistanceProfessionals() {
    this.costAssistanceProfessionalLoading.set(true)
    this.opinionService.getCostAssistanceProfessionals().subscribe({
      next: (response) => {
        this.costAssistanceProfessionalOptions = response.map((item: any) => {return {...item.patient, ...item}})
        this.setCostAssistanceProfessionalOptions()
      },
      complete: () => {
        this.costAssistanceProfessionalLoading.set(false)
        this.costAssistanceProfessionalReadOnly.set(false)
      }
    })
  }
  costAssistanceProfessionalControl = new FormControl<string | any>('', Validators.required);
  costAssistanceProfessionalOptions!: any[];
  filteredCostAssistanceProfessionalOptions!: Observable<any[]>;
  costAssistanceProfessionalReadOnly = signal<boolean>(true)
  costAssistanceProfessionalLoading = signal<boolean>(false)
  setCostAssistanceProfessionalOptions() {
    this.filteredCostAssistanceProfessionalOptions = this.costAssistanceProfessionalControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterAssistanceCostProfessional(name as string) : this.costAssistanceProfessionalOptions.slice();
      }),
    );
  }
  onCostAssistanceProfessionalSelected(option: any) {
    if (option && option.id) {
      this.processPatientRequestForm.patchValue({
        cost_assistance_professional_id: option.id
      });
      this.processPatientRequestForm.markAsDirty()
    } 
  }
  private _filterAssistanceCostProfessional(name: string): any[] {
    const FILTER_VALUE = name.toLowerCase();

    return this.costAssistanceProfessionalOptions.filter(option => option.name.toLowerCase().includes(FILTER_VALUE));
  }
  displayCostAssistanceProfessional(costAssistanceProfessional: any): string {
    return costAssistanceProfessional && costAssistanceProfessional.name ? costAssistanceProfessional.name : '';
  }
  
  getTravelProfessionals() {
    this.travelProfessionalLoading.set(true)
    this.opinionService.getTravelProfessionals().subscribe({
      next: (response) => {
        this.travelProfessionalOptions = response
        this.setTravelProfessionalOptions()
      },
      complete: () => {
        this.travelProfessionalLoading.set(false)
        this.travelProfessionalReadOnly.set(false)
      }
    })
  }
  travelProfessionalControl = new FormControl<string | any>('');
  travelProfessionalOptions!: any[];
  filteredTravelProfessionalOptions!: Observable<any[]>;
  travelProfessionalReadOnly = signal<boolean>(true)
  travelProfessionalLoading = signal<boolean>(false)
  setTravelProfessionalOptions() {
    this.filteredTravelProfessionalOptions = this.travelProfessionalControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterTravelProfessional(name as string) : this.travelProfessionalOptions.slice();
      }),
    );
  }
  onTravelProfessionalSelected(option: any) {
    if (option && option.id) {
      this.processPatientRequestForm.patchValue({
        travel_professional_id: option.id
      });
    }
  }
  private _filterTravelProfessional(name: string): any[] {
    const FILTER_VALUE = name.toLowerCase();

    return this.travelProfessionalOptions.filter(option => option.name.toLowerCase().includes(FILTER_VALUE));
  }
  displayTravelProfessional(travelProfessional: any): string {
    return travelProfessional && travelProfessional.name ? travelProfessional.name : '';
  }

  wSubmit = signal<boolean>(false)
  onTramitPatientRequestSubmit() {
    this.wSubmit.set(true);
    this.opinionService.processPatientRequestToCostAssistanceAndTravel(this.data.patient_request.id, this.processPatientRequestForm.value).subscribe({
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
