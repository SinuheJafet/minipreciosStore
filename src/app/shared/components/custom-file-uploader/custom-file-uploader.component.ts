import { Component, OnInit, Output, EventEmitter, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FileUploader } from 'ng2-file-upload';
import { environment } from 'environments/environment';
import { MsgService } from 'app/shared/modules/msg/services/msg.service';
import { AuthenticationService } from 'app/modules/auth/authentication.services';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-custom-file-uploader',
  templateUrl: './custom-file-uploader.component.html',
  styleUrls: ['./custom-file-uploader.component.scss']
})
export class CustomFileUploaderComponent implements OnInit, AfterViewInit {
  @ViewChild("uploadInput") uploadInput: ElementRef;
  @Input() appId: number = 0;
  @Input() referenceId: number = 0;
  @Input() validTypes: string = '*';
  @Input() customStyle: 'normal' | 'small' = 'normal';
  @Input() clearOnComplete: boolean = false;
  @Input("uploadControl") uploadControl: MatButton;
  @Output() onComplete: EventEmitter<any> = new EventEmitter<any>();
  @Output() onBeforeUpload: EventEmitter<any> = null;
  @Output() onSelectedFile: EventEmitter<any> = new EventEmitter<any>();
  @Output() settings: CustomFileUploaderSettings;

  uploader: FileUploader = null;
  progress: number = 0;
  fileSelected: boolean = false;
  @Input() uploadComplete: boolean = false;
  customUpload: boolean = false;

  /**
   * Constructor
   * @param _authenticationService Authentication Service
   */
  constructor(
    private _authenticationService: AuthenticationService
    , private _msg: MsgService
  ) { }

  /**
   * On After View Init
   */
  ngAfterViewInit(): void {
    if (this.uploadControl != null) {
      this.uploadControl._elementRef.nativeElement.onclick = () => { this.uploadFromCustom(); }
    }
  }

  /**
   * On Init
   */
  ngOnInit() {
    this._configUploader();
    this.customUpload = (this.uploadControl != null);
  }

  onFileSelected(event: any) {    
   
    this._validateFileExtension();
    this.fileSelected = (event.target.files && event.target.files.length);
    
    if (this.onSelectedFile)
      this.onSelectedFile.emit(event.target.files);
  }

  openFolder() {
    if (this.uploadInput != undefined) {
      this.uploader.clearQueue()
      this.uploadInput.nativeElement.click();
    }
  }

  /**
   * Upload 
   */
  upload() {
    if (!this._validateFileExtension()) return;
    if (this.customUpload) return;
    if (this.onBeforeUpload)
      this.onBeforeUpload.emit();
    this.uploader.uploadAll();
  }

  /**
   * Upload from custom button
   */
  uploadFromCustom() {
    if (!this._validateFileExtension()) return;
    if (this.onBeforeUpload)
      this.onBeforeUpload.emit();
    this.uploader.uploadAll();
  }

  /**
   * Upload Cancel: Clear file input elements 
   */
  cancel() {
    
    this.uploader.clearQueue();
    this.fileSelected = false;
    this.uploadInput.nativeElement.value = '';
    this.onSelectedFile.emit(null);
    this.uploadComplete = false;
    this.uploader.isUploading = false;
  }

  private _validateFileExtension(): boolean {
    let result = false;
    let file = this.uploader.queue[0].file;
    if (this.validTypes == '*' || this.validTypes.indexOf(this._getExtensionFile(file.name)) > 0)
      result = true;
    else {
      result = false;
      this._msg.error("Tipo de archivo incorrecto");
      this.cancel();
    }
    return result;
  }

  /**
   * Config Uploader
   */
  private _configUploader() {
    // let userId = this._authenticationService.getCurrentUser().Id;

    let token = JSON.parse(localStorage.getItem("token"));

    this.uploader = new FileUploader({
      url: `${environment.appUrl}FileObject/${this.appId}/${this.referenceId}`,
      authToken: `Bearer ${token.accessToken}`,
      itemAlias: 'addFiles'
    });

    this.uploader.onProgressAll = (progress) => {
      this.progress = progress;
    };

    this.uploader.onAfterAddingFile =
      (file) => { file.withCredentials = false; };

    this.uploader.onCompleteItem =
      (item: any, response: any, status: any, headers: any) => {
        if (status == 200) {
          let file = JSON.parse(response);
        
          if (this.onComplete) {
            this.onComplete.emit(file);
            this.uploadComplete = true;
          }
          if (this.clearOnComplete)
            this.cancel();
        }
      };
  }

  private _getExtensionFile(filename: string): string {
    return filename.split('.').pop();
  }
}

export class CustomFileUploaderSettings {
  appUrl: string;
}