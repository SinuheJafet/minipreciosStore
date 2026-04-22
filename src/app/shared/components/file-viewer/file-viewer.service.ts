import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FileViewerComponent } from './file-viewer.component';

@Injectable({
  providedIn: 'root'
})
export class FileViewerService {

  constructor(
    private _matDialog: MatDialog
  ) { }

  show(url: string, allowDownload: boolean = false) {
    this._matDialog.open(FileViewerComponent, { data: { url: url, allowDownload: allowDownload }, panelClass: 'dialog-content-wrapper' });
  }
}
