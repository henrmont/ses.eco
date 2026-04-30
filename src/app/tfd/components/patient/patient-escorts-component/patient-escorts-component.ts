import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {MatTableModule, MatTableDataSource} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { NgxMaskPipe } from 'ngx-mask';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Escort } from '../../../models/escort';
import { PatientService } from '../../../services/patient-service';
import { ShowPatientEscortComponent } from '../show-patient-escort-component/show-patient-escort-component';
import { CreatePatientEscortComponent } from '../create-patient-escort-component/create-patient-escort-component';
import { UpdatePatientEscortComponent } from '../update-patient-escort-component/update-patient-escort-component';
import { DeletePatientEscortComponent } from '../delete-patient-escort-component/delete-patient-escort-component';

@Component({
  selector: 'app-patient-escorts-component',
  imports: [FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatTableModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule, MatSlideToggleModule, NgxMaskPipe],
  templateUrl: './patient-escorts-component.html',
  styleUrl: './patient-escorts-component.scss',
})
export class PatientEscortsComponent implements OnInit {

  data = inject(MAT_DIALOG_DATA);
  displayedColumns: string[] = ['name','document','cns','status','actions'];
  dataSource = signal<MatTableDataSource<Escort>>(new MatTableDataSource());
  patientEscorts = signal<Escort[]>([])
  isLoading = signal<boolean>(true);

  constructor(
    private dialog: MatDialog,
    private patientService: PatientService,
  ) {}

  ngOnInit(): void {
    this.getPatientEscorts();
  }

  getPatientEscorts() {
    this.patientService.getPatientEscorts(this.data.patient_care.id).subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response)) 
      },
      complete: () => {
        this.isLoading.set(false);
      }
    })
  }

  upgradePatientEscorts() {
    this.patientService.getPatientEscorts(this.data.patient_care.id).subscribe({
      next: (response) => {
        this.dataSource.set(new MatTableDataSource(response)) 
      },
    })
  }

  checkPermissions(name: any) {
    const ROLES = this.data.permissions
    for (const item of ROLES) {
      if (item.permissions.filter((permission: any) => permission.name == name).length > 0)
        return false 
    }
    return true
  }

  showPatientEscort(escort: Escort) {
    this.dialog.open(ShowPatientEscortComponent, {
      width: '800px',
      height: '700px',
      disableClose: true,
      autoFocus: false,
      data: {
        escort: escort,
      }
    })
  }

  createPatientEscort() {
    this.dialog.open(CreatePatientEscortComponent, {
      width: '800px',
      height: '700px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_care: this.data.patient_care,
      }
    }).afterClosed().subscribe(result => {
      if (result)
        this.upgradePatientEscorts()
    })
  }

  updatePatientEscort(escort: Escort) {
    this.dialog.open(UpdatePatientEscortComponent, {
      width: '800px',
      height: '700px',
      disableClose: true,
      autoFocus: false,
      data: {
        patient_care: this.data.patient_care,
        escort: escort,
      }
    }).afterClosed().subscribe(result => {
      if (result)
        this.upgradePatientEscorts()
    })
  }

  deletePatientEscort(escort: Escort) {
    this.dialog.open(DeletePatientEscortComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: {
        escort: escort,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.isLoading.set(true)
        this.getPatientEscorts()
      }
    })
  }

}
