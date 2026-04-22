import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkTableModule } from '@angular/cdk/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { FlexLayoutModule } from '@angular/flex-layout';
import { DynamicTableComponent } from './dynamic-table.component';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';


@NgModule({
  declarations: [DynamicTableComponent],
  imports: [
    CommonModule
    , MatTableModule
    , MatInputModule
    , MatIconModule
    , MatButtonModule
    , MatSortModule
    , MatPaginatorModule      
    , CdkTableModule
    , MatFormFieldModule    
    , FormsModule
    , MatTooltipModule
    , MatSlideToggleModule
    , MatBadgeModule
    , ReactiveFormsModule
    , MatMenuModule
    , MatOptionModule
    , MatSelectModule
  ]
  ,  exports: [DynamicTableComponent]
})
export class DynamicTableModule { }
