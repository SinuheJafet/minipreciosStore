import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomFileUploaderComponent } from './custom-file-uploader.component';
import { FileUploadModule } from 'ng2-file-upload';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [
    CustomFileUploaderComponent
  ],
  exports : [
    CustomFileUploaderComponent
  ],
  imports: [
    CommonModule
    , MatProgressSpinnerModule
    , FileUploadModule
    , MatProgressBarModule
    , MatButtonModule
    , MatIconModule
    , MatTooltipModule
  ]
})
export class CustomFileUploaderModule { }
