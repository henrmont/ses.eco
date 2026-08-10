import { Module } from "./module";
import { Professional } from "./professional";
import { Role } from "./role.model";

export interface User {
    id?: number;
    name?: string;
    email?: string;
    roles?: Role[];
    module?: Module;
    modules?: Module[];
    image?: string;
    is_valid?: boolean;
    is_editable?: boolean;
    professional?: Professional;
    type?: string;
}
