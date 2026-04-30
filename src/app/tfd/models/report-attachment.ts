import { Archive } from "./archive";
import { Report } from "./report";

export interface ReportAttachment {
    id: number,
    report_id: number,
    archive_id: number,
    name: string,
    report?: Report,
    archive?: Archive,
}
