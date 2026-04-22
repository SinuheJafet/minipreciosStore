import { Component, OnInit, Inject } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { RestService } from "app/shared/services/rest.service";

export interface CustomDialogData {
    message: string
}

@Component({
    selector: 'custom-dialog',
    templateUrl: './custom-dialog.component.html',
    styleUrls: ['./custom-dialog.component.css']
})

export class CustomDialogComponent {
    public passwordForm: FormGroup;
    public submitted: Boolean;
    public Password: string;
    public PasswordConfirm: string
    public hide = true;
    public hideConfirm = true;

    constructor(
          public rest: RestService
        , public dialogRef: MatDialogRef<CustomDialogComponent>
        , @Inject(MAT_DIALOG_DATA) public data: CustomDialogData) { }
}