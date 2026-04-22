import { NgModule } from '@angular/core';
import { FileViewerComponent } from './file-viewer.component';
// import { MatIconModule, MatProgressSpinnerModule, MatProgressBarModule, MatButtonModule, MatTooltipModule, MatDialogModule } from '@angular/material';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { PipeModule } from 'app/shared/pipes/pipe.module';
// import { PipeModule } from 'app/pipes/pipe.module';

const routes = [
    {
        path: 'file-fileviewer',
        component: FileViewerComponent,
    }];   

@NgModule({
    declarations: [
        FileViewerComponent
    ],
    exports: [
        FileViewerComponent
    ],
    imports: [        
        RouterModule.forChild(routes)
        , CommonModule
        , MatProgressSpinnerModule        
        , MatProgressBarModule
        , MatButtonModule
        , MatIconModule
        , MatTooltipModule
        , MatDialogModule
        , PdfViewerModule
        , PipeModule
    ]
})
export class FileViewerModule { }
