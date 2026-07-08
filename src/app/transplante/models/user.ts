import { Module } from "./module";
import { Role } from "./role";

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
}
