import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-file-viewer',
  templateUrl: './file-viewer.component.html',
  styleUrls: ['./file-viewer.component.scss'],
})
export class FileViewerComponent implements OnInit {
  public extension: string = "";
  public name: string = "file";
  public src = '';
  public xmlContent: string = "";
  public allowDownload: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any
    , private _matDialogRef: MatDialogRef<FileViewerComponent>
    , private _httpClient: HttpClient
  ) { }

  ngOnInit() {
    if (this.data != undefined) {
      this.src = `${this.data.url.toLowerCase()}`;      
      this.allowDownload = this.data.allowDownload;
      this.setExtension();
    }
  }
  setExtension() {
    this.extension = this.src.substring(this.src.lastIndexOf("."));
    this.name = this.src.substring(this.src.lastIndexOf("/") + 1);
    if (this.extension == '.xml') {      
      this._httpClient.get(this.src, { responseType: 'text' }).subscribe(response => {
        this.xmlContent = response;        
      });
    }
  }

  close() {
    this._matDialogRef.close();
  }

  download() {
    downloadDataUrlFromJavascript(`${this.src}`, this.name);
  }

}

function downloadDataUrlFromJavascript(dataUrl, filename) {

  // Construct the 'a' element
  var link = document.createElement("a");
  link.download = filename;
  link.target = "_blank";

  // Construct the URI
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();

  // Cleanup the DOM
  document.body.removeChild(link);
  // delete link;
}