import { ValidatorFn } from "@angular/forms";
import { FileManagerObject } from "app/shared/modules/file-manager/entities/file-manager-object.type";
import { Observable } from "rxjs";

export class BaseProperty {
    name: string;
    title?: string;
    showOnAddOrEdit?: boolean;
    showOnTable?: boolean;
    disabledOnEdit?: boolean;
    type?: 'text' | 'number' | 'decimal' | 'date' | 'list' | 'currency' | 'color' | 'boolean' | 'email' | 'file' | 'time';
    source?: Source;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    defaultValue?: any;    
    validators?: ValidatorFn[];
    minDate?: Date;
    maxDate?: Date;
    disabled?: boolean;
    beforeSend?: any;
    parseTo?: 'int' | 'float' | 'date' | 'string' | 'boolean';
    fileNumber?: number;
    fileType?: number;
    fileList?: FileManagerObject[];
    fileLinkProp?: string;
    fileIdProp?: string;
    fileUploadComplete?: any;
    fileDeleteComplete?: any;
}

export class Source {
    appUrl: string;
    apiName: string;    
    showPropertyName: string;
    valuePropertyName: string;
}
export class DynamicFormSettings {
    confirmOnSave?: boolean
}