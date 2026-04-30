import { PatientCare } from "./patient-care";
import { PatientRequest } from "./patient-request";

export interface Report {
    id: number,
    patient_care_id: number,
    protocol: string,
    sigadoc: string,
    cid_id: number,
    lawsuit: boolean,
    diagnosis: string,
    patient_care?: PatientCare,
    cid: any,
    patient_requests?: PatientRequest[], 
}
