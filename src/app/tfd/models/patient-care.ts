import { Escort } from "./escort"
import { Module } from "./module"
import { Patient } from "./patient"
import { Report } from "./report"
import { User } from "./user"

export interface PatientCare {
    id: number,
    patient_id: number,
    module_id: number,
    is_valid: boolean,
    user_id: number,
    is_archived: boolean,
    back_to_user: string | null,
    status: boolean,
    patient?: Patient,
    module?: Module,
    user?: User,
    escorts?: Escort[],
    reports?: Report[]
}
