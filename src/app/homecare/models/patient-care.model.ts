import { Module } from "./module.model"
import { Patient } from "./patient.model"
import { User } from "./user.model"

export interface PatientCare {
    id?: number,
    patient_id?: number,
    module_id?: number,
    is_valid?: boolean,
    user_id?: number,
    is_archived?: boolean,
    back_to_user?: string | null,
    status?: boolean,
    patient?: Patient,
    module?: Module,
    user?: User,
    owner?: boolean
}
