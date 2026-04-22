import { NgModule } from '@angular/core';
import { CustomAutocompleteComponent } from './custom-autocomplete.component';
import {MatSelectModule} from '@angular/material/select';
import {MatDialogModule} from '@angular/material/dialog'
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FuseSharedModule } from 'app/shared/fuse-shared.module';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  exports: [
    CustomAutocompleteComponent
  ],
  declarations: [
    CustomAutocompleteComponent
  ],
  imports: [
    FuseSharedModule
    , MatAutocompleteModule
    , MatInputModule
    , MatFormFieldModule
    , MatIconModule,
    MatSelectModule,
    MatDialogModule,
    ScrollingModule,

  ] 
})
export class CustomAutocompleteModule { }
 