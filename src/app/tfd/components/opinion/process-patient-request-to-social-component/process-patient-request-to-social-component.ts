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
  selector: 'app-process-patient-request-to-social-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatProgressSpinnerModule, MatChipsModule],
  templateUrl: './process-patient-request-to-social-component.html',
  styleUrl: './process-patient-request-to-social-component.scss',
})
export class ProcessPatientRequestToSocialComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA)
  errorMessages = ERRORS
  processPatientRequestForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private opinionService: OpinionService,
    private messageService: MessageService,
    private dialog: MatDialogRef<ProcessPatientRequestToSocialComponent>,
  ) {
    this.processPatientRequestForm = this.formBuilder.group({
      social_professional_id: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.getSocialProfessionals()
  }

  getSocialProfessionals() {
    this.socialProfessionalLoading.set(true)
    this.opinionService.getSocialProfessionals().subscribe({
      next: (response) => {
        this.socialProfessionalOptions = response.map((item: any) => {return {...item.patient, ...item}})
        this.setSocialProfessionalOptions()
      },
      complete: () => {
        this.socialProfessionalLoading.set(false)
        this.socialProfessionalReadOnly.set(false)
      }
    })
  }
  socialProfessionalControl = new FormControl<string | any>('', Validators.required);
  socialProfessionalOptions!: any[];
  filteredSocialProfessionalOptions!: Observable<any[]>;
  socialProfessionalReadOnly = signal<boolean>(true)
  socialProfessionalLoading = signal<boolean>(false)
  setSocialProfessionalOptions() {
    this.filteredSocialProfessionalOptions = this.socialProfessionalControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        return name ? this._filterSocialProfessional(name as string) : this.socialProfessionalOptions.slice();
      }),
    );
  }
  onSocialProfessionalSelected(option: any) {
    if (option && option.id) {
      this.processPatientRequestForm.patchValue({
        social_professional_id: option.id
      });
    }
  }
  private _filterSocialProfessional(name: string): any[] {
    const filterValue = name.toLowerCase();

    return this.socialProfessionalOptions.filter(option => option.name.toLowerCase().includes(filterValue));
  }
  displaySocialProfessional(socialProfessional: any): string {
    return socialProfessional && socialProfessional.name ? socialProfessional.name : '';
  }

  wSubmit = signal<boolean>(false)
  onSubmit() {
    this.wSubmit.set(true);
    this.opinionService.processPatientRequestToSocial(this.data.patient_request.id, this.processPatientRequestForm.value).subscribe({
      next: (response: any) => {
        this.messageService.showMessage(response.message)
        this.dialog.close(true)
      },
      error: (err) => {
        this.messageService.showMessage(err.error.message)
        this.wSubmit.set(false);
      },
    })
  }

}
