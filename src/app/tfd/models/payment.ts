import { CostAssistance } from "./cost-assistance";

export interface Payment {
    id: number,
    cost_assistance_id: number,
    name: string,
    description: string,
    cost_assistance: CostAssistance,
    status: boolean
}
