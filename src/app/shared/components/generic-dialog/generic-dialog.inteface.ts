import { EventEmitter } from "@angular/core";
import { GenericDialogOptions } from "./generic-dialog-entities/generic-dialog-options";


export class IGenericDialog {
    data: any;
    actions: any[];
    eventClose: EventEmitter<any>;
    options: GenericDialogOptions;
}