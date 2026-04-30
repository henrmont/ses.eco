import { AccountabilityDaily } from "./accountability-daily";
import { PatientRequest } from "./patient-request";

export interface Accountability {
    id: number,
    patient_request_id: number,
    name: string,
    status: boolean,
    patient_request?: PatientRequest,
    accountability_dailies?: AccountabilityDaily[]
}
