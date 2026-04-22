import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { environment } from 'environments/environment';
import { FileViewerService } from '../file-viewer/file-viewer.service';
import { MsgService } from 'app/shared/modules/msg/services/msg.service';

@Component({
  selector: 'file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss'],
  animations: fuseAnimations
})
export class FileListComponent implements OnInit {

  // INPUTS
  @Input() title: String = "Archivos";
  @Input() files: any[] = [];
  //each file of files has { fileManagerId: , fileManagerName: , fileManagerExtension:, fileManagerRealName:  }
  @Input() appId: number = 0;
  @Input() referenceId: number = 0;
  @Input() fileManagerExposeUrl: String = environment.fileManagerExposeUrl;
  @Input() allowedFiles: String = ".png,.PNG,.jpg,.JPG,.jpeg,.JPEG,.pdf,.PDF,.xml,.XML,.mp4,.MP4,.gif,.GIF";
  @Input() limit: number = 0;
  @Input() allowDownload: boolean = false;
  @Input() allowUpload: boolean = true;
  @Input() showDelete: boolean = true;
  @Input() filesAlign: string = 'center start';
  @Input() showHorizontal: boolean=true;
   @Input() isFrame: boolean=false;
  // END INPUTS  

  // OUTPUTS
  @Output() deleted: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  // END OUTPUTS

  //LOCALS
  allowDelete: boolean = false;
  //END LOCALS

  constructor(
    private _msgService: MsgService
    , private _fileViewerService: FileViewerService
  ) { }

  ngOnInit() {
  }

  uploadComplete(file: any) {
    let fileName = `${file.name}${file.extension}`;
    let data =
    {
      id: 0,
      fileManagerId: file.id,
      fileManagerName: fileName,
      fileManagerExtension: file.extension.toLowerCase(),
      fileManagerRealName: file.realName,
      mimeType: file.mimeType
    };
    this.files.push(data);
    this.saved.emit(data);
    this._msgService.success("Archivo cargado correctamente :D");
  }


  viewFile(file: any) {
    this._fileViewerService.show(`${this.fileManagerExposeUrl}${file.fileManagerName}`, this.allowDownload);
  }


  delete(file: any) {
    this._msgService.confirm("¿Eliminar archivo?").subscribe(c => {
      if (c) {
        this.deleted.emit(this.files.splice(this.files.indexOf(file), 1)[0]);
      }
    });
  }

  changeDelete(event: any) {
    this.allowDelete = event.checked;
  }
  changeImageClass(): string {
    // if (this.isFrame === true) {
    //   return 'frame-custom-avatar image';
    // } else {
      return 'custom-avatar image';
    //}
  }
}
