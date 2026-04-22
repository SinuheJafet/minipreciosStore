import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GenericDialogComponent } from './generic-dialog.component';
import { GenericDialogDirective } from './generic-dialog.directive';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';

@NgModule({
    declarations: [
        GenericDialogComponent,
        GenericDialogDirective
    ],
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatToolbarModule,
        MatIconModule,
        MatTooltipModule,
        MatSelectModule
    ],
    exports: [
        GenericDialogComponent
    ]
})
export class GenericDialogModule { }
