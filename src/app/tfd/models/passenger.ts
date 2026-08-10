import { TravelGender } from "../enums/travel-gender";

export interface Passenger {
    id?: number,
    travel_id?: number,
    is_patient?: boolean,
    patient_id?: number,
    escort_id?: number,
    tariff: number,
    tax: number,
    discount: number,
    type: 'ADT' | 'CHD',
    gender?: TravelGender,
    seat?: string,
    ticket?: string,
}
