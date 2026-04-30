import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Patient } from '../models/patient';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { PatientCare } from '../models/patient-care';
import * as moment from 'moment';
import { Escort } from '../models/escort';
import { ReportAttachment } from '../models/report-attachment';

const requestOptions = {
  'Authorization': `Bearer ${window.localStorage.getItem('token')}`
}

@Injectable({
  providedIn: 'root',
})
export class PatientService {

  constructor(
    private http: HttpClient,
  ) {}

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${environment.apiTfdUrl}/patient/get-patients`, {headers: requestOptions})
  }

  createPatient(data: any): Observable<Array<any>> {
    return this.http.post<Array<any>>(`${environment.apiTfdUrl}/patient/create-patient`, this.mountFormData(data), {headers: requestOptions})
  }

  updatePatient(patient: number, data: any): Observable<Array<any>> {
    return this.http.post<Array<any>>(`${environment.apiTfdUrl}/patient/update-patient/${patient}`, this.mountFormData(data), {headers: requestOptions})
  }

  getPatientEscorts(patient_care: number): Observable<Escort[]> {
    return this.http.get<Escort[]>(`${environment.apiTfdUrl}/patient/get-patient-escorts/${patient_care}`, {headers: requestOptions})
  }

  createPatientEscort(patient_care: number, data: any): Observable<Array<any>> {
    return this.http.post<Array<any>>(`${environment.apiTfdUrl}/patient/create-patient-escort/${patient_care}`, this.mountFormData(data), {headers: requestOptions})
  }

  updatePatientEscort(escort: number, data: any): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/patient/update-patient-escort/${escort}`, this.mountFormData(data), {headers: requestOptions})
  }

  deletePatientEscort(escort: number): Observable<Array<any>> {
    return this.http.delete<Array<any>>(`${environment.apiTfdUrl}/patient/delete-patient-escort/${escort}`, {headers: requestOptions})
  }

  getPatientReports(patient_care: number): Observable<Report[]> {
    return this.http.get<Report[]>(`${environment.apiTfdUrl}/patient/get-patient-reports/${patient_care}`, {headers: requestOptions})
  }

  getCids(patient_care: number): Observable<any> {
    return this.http.get<any>(`${environment.apiTfdUrl}/patient/get-cids/${patient_care}`, {headers: requestOptions})
  }

  createPatientReport(patient_care: number, data: Report): Observable<Array<any>> {
    return this.http.post<Array<any>>(`${environment.apiTfdUrl}/patient/create-patient-report/${patient_care}`, data, {headers: requestOptions})
  }

  updatePatientReport(report: number, data: Report): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/patient/update-patient-report/${report}`, data, {headers: requestOptions})
  }

  deletePatientReport(report: number): Observable<Array<any>> {
    return this.http.delete<Array<any>>(`${environment.apiTfdUrl}/patient/delete-patient-report/${report}`, {headers: requestOptions})
  }

  getReportAttachments(report: number): Observable<ReportAttachment[]> {
    return this.http.get<ReportAttachment[]>(`${environment.apiTfdUrl}/patient/get-report-attachments/${report}`, {headers: requestOptions})
  }

  createReportAttachment(report: number, data: any): Observable<Array<any>> {
    return this.http.post<Array<any>>(`${environment.apiTfdUrl}/patient/create-report-attachment/${report}`, this.mountFormData(data), {headers: requestOptions})
  }

  updateReportAttachment(report_attachment: number, data: any): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/patient/update-report-attachment/${report_attachment}`, this.mountFormData(data), {headers: requestOptions})
  }

  deleteReportAttachment(report_attachment: number): Observable<Array<any>> {
    return this.http.delete<Array<any>>(`${environment.apiTfdUrl}/patient/delete-report-attachment/${report_attachment}`, {headers: requestOptions})
  }

  archivePatient(patient_care: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/patient/archive-patient/${patient_care}`, {headers: requestOptions})
  }

  movePatientFromArchive(patient_care: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/patient/move-patient-from-archive/${patient_care}`, {headers: requestOptions})
  }

  movePatientFromOthers(patient_care: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/patient/move-patient-from-others/${patient_care}`, {headers: requestOptions})
  }

  validatePatient(patient_care: number): Observable<Array<any>> {
    return this.http.patch<Array<any>>(`${environment.apiTfdUrl}/patient/validate-patient/${patient_care}`, {headers: requestOptions})
  }

  // Checks
  getEscortCns(cns: number): Observable<Escort> {
    return this.http.get<Escort>(`${environment.apiTfdUrl}/checks/get-escort-cns/${cns}`, {headers: requestOptions})
  }

  getEscortDocument(document: number): Observable<Escort> {
    return this.http.get<Escort>(`${environment.apiTfdUrl}/checks/get-escort-document/${document}`, {headers: requestOptions})
  }
  
  // Validators
  cnsPatientExistsValidator(data: string | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const cns = control.value;

      if (!cns) return of(null);

      return this.http.get<{ cnsExists: boolean }>(`${environment.apiTfdUrl}/validator/cns-patient-exists/${cns}/${data}`, { headers: requestOptions }).pipe(
        map(res => {
          return res ? { cnsExists: true } : null;
        }),
        catchError(() => of(null))
      );
    };
  }

  cnsEscortExistsValidator(patient_care: PatientCare, data: string | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const cns = control.value;

      if (!cns) return of(null);

      if (patient_care.patient?.cns === cns) return of({ cnsPatientExists: true });

      return this.http.get<{ cnsExists: boolean }>(`${environment.apiTfdUrl}/validator/cns-escort-exists/${patient_care.id}/${cns}/${data}`, { headers: requestOptions }).pipe(
        map(res => {
          return res ? { cnsExists: true } : null;
        }),
        catchError(() => of(null))
      );
    };
  }

  documentPatientExistsValidator(data: string | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const document = control.value;

      if (!document) return of(null);

      return this.http.get<{ documentExists: boolean }>(`${environment.apiTfdUrl}/validator/document-patient-exists/${document}/${data}`, { headers: requestOptions }).pipe(
        map(res => {
          return res ? { documentExists: true } : null;
        }),
        catchError(() => of(null))
      );
    };
  }

  documentEscortExistsValidator(patient_care: PatientCare, data: string | null | undefined): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const document = control.value;

      if (!document) return of(null);

      if (patient_care.patient?.document === document) return of({ documentPatientExists: true });

      return this.http.get<{ documentExists: boolean }>(`${environment.apiTfdUrl}/validator/document-escort-exists/${patient_care.id}/${document}/${data}`, { headers: requestOptions }).pipe(
        map(res => {
          return res ? { documentExists: true } : null;
        }),
        catchError(() => of(null))
      );
    };
  }

  // Resources
  private mountFormData(data: any): FormData
  {
    const formData = new FormData()
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof File || value instanceof Blob)
        formData.append(key, value, 'file');
      else if (moment.isMoment(value))
        formData.append(key, value.format('YYYY-MM-DD'));
      else if (value !== null && value !== undefined)
        formData.append(key, value as string);
    }
    return formData
  }
  
}
