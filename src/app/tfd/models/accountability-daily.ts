import { Accountability } from "./accountability";
import { DailyCost } from "./daily-cost";

export interface AccountabilityDaily {
    id: number,
    accountability_id: number,
    daily_cost_id: number,
    amount: number,
    accountability: Accountability,
    daily_cost: DailyCost
}
