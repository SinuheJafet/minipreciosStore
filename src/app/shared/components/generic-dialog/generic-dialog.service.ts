import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { GenericDialogOptions } from './generic-dialog-entities/generic-dialog-options';
import { GenericDialogComponent } from './generic-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class GenericDialogService {

  private _optionsDefault: GenericDialogOptions;
  private _options: GenericDialogOptions;

  constructor(
    private _matDialog: MatDialog
  ) { 
    this._optionsDefault = {
      disableClose: false,
      showCancelAction: false,
      width: '500px',
      height: '500px'
    }
  }

  openDialog(componentDialog: any, title: String, data: any, options: GenericDialogOptions = null): MatDialogRef<any> {
    this._options = Object.assign(this._optionsDefault, options);
    
    const dialogRef = this._matDialog
      .open(
        GenericDialogComponent
        , {
          data: {
            component: componentDialog
            , title: title
            , data: data
            , options: this._options
          }
          , disableClose: this._options.disableClose
          , panelClass: "generic-dialog-root"          
          , width: this._options.width
          , minWidth: this._options.width
          , maxWidth: this._options.width
          , height: this._options.height
          , minHeight: this._options.height
          , maxHeight: this._options.height
        }
      );
    return dialogRef;
  }

}
