import { Observable } from "rxjs";

export class GenericAction {
    name: String;
    click?: any;
    redirectTo?: string;
    tooltip: String
    color: String
    $disabled?: Observable<Boolean>;
}