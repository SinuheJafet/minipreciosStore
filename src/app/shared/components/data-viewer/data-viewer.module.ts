import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseSharedModule } from 'app/shared/fuse-shared.module';
import { DataViewerComponent } from './data-viewer.component';

@NgModule({
  declarations: [
    DataViewerComponent
  ],
  exports: [
    DataViewerComponent
  ],
  imports: [
    FuseSharedModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatTooltipModule,
  ]
})
export class DataViewerModule { }
