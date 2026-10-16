import { Module } from "./module.model";
import { Role } from "./role.model";

export interface User {
    id?: number;
    name?: string;
    email?: string;
    roles?: Role[];
    module?: Module;
    modules?: Module[];
    valid_modules?: Module[];
    image?: string;
    is_valid?: boolean;
    is_editable?: boolean;
}
