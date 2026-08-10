import { PatientCare } from "./patient-care";
import { PatientRequest } from "./patient-request";
import { ReportAttachment } from "./report-attachment";

export interface Report {
    id: number,
    patient_care_id: number,
    protocol: string,
    cid_id: number,
    lawsuit: boolean,
    diagnosis: string,
    is_export: boolean,
    patient_care?: PatientCare,
    cid: any,
    patient_requests?: PatientRequest[], 
    attachments?: ReportAttachment[],
    has_patient_requests?: boolean,
    has_entrance_or_lawsuit?: boolean
}
