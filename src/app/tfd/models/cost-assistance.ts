import { CostAssistanceType } from "../enums/cost-assistance-type";
import { CostAssistanceDaily } from "./cost-assistance-daily";
import { PatientRequest } from "./patient-request";

export interface CostAssistance {
    id: number,
    patient_request_id: number,
    name: string,
    type: CostAssistanceType,
    status: boolean,
    patient_request?: PatientRequest,
    cost_assistance_dailies?: CostAssistanceDaily[]
}
