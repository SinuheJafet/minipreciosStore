import { EventEmitter } from "@angular/core";
import { GenericAction } from "./generic-dialog-entities/generic-action";
import { GenericDialogOptions } from "./generic-dialog-entities/generic-dialog-options";
import { IGenericDialog } from "./generic-dialog.inteface";

export class GenericDialog implements IGenericDialog {
    eventClose: EventEmitter<any> = new EventEmitter<any>();
    
    public data: any;
    public actions: GenericAction[] = [];    
    options: GenericDialogOptions;

    public close(dialogResult: any=undefined) {
        this.eventClose.emit(dialogResult);
    }
}