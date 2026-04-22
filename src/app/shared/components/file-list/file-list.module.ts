import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FuseSharedModule } from "app/shared/fuse-shared.module";
import { MsgModule } from "app/shared/modules/msg/msg.module";
import { CustomFileUploaderModule } from "../custom-file-uploader/custom-file-uploader.module";
import { FileViewerModule } from "../file-viewer/file-viewer.module";
import { FileListComponent } from "./file-list.component";

@NgModule({
    declarations: [FileListComponent],
    imports: [
        CommonModule
        , FuseSharedModule
        , MsgModule
        , FileViewerModule
        , MatButtonModule
        , MatSlideToggleModule
        , MatIconModule
        , CustomFileUploaderModule
        , MatTooltipModule
    ]
    , exports: [FileListComponent]
})
export class FileListModule { }
