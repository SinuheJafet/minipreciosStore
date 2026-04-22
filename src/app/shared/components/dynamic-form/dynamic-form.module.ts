import { NgModule } from '@angular/core';
import { DynamicFormComponent } from './dynamic-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskModule } from 'ngx-mask'
import { CustomAutocompleteModule } from '../custom-autocomplete/custom-autocomplete.module';
import { FuseSharedModule } from 'app/shared/fuse-shared.module';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { FileManagerModule } from 'app/shared/modules/file-manager/file-manager.module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CustomSpinnerModule } from '../custom-spinner/custom-spinner.module';
import {MatSelectModule} from '@angular/material/select';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true
};
@NgModule({
  declarations: [DynamicFormComponent],
  imports: [
    FuseSharedModule
    , FormsModule
    , PerfectScrollbarModule
    , MatInputModule
    , MatIconModule
    , MatTooltipModule
    , ReactiveFormsModule
    , MatFormFieldModule    
    , NgxMaskModule.forRoot()
    , MatButtonModule
    , CustomAutocompleteModule
    // , FuseMaterialColorPickerModule
    , MatSlideToggleModule
    , FileManagerModule
    , MatDatepickerModule
    , MatNativeDateModule
    , CustomSpinnerModule
    , MatSelectModule
  ]
  , exports: [DynamicFormComponent]
  , providers: [
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
    },    
  ]
})
export class DynamicFormModule { }
