import { CostAssistance } from "./cost-assistance";
import { DailyCost } from "./daily-cost";

export interface CostAssistanceDaily {
    id: number,
    cost_assistance_id: number,
    daily_cost_id: number,
    amount: number,
    cost_assistance: CostAssistance,
    daily_cost: DailyCost
}
