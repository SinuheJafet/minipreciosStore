import { NgModule } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PipeModule } from 'app/shared/pipes/pipe.module';
import { FuseSharedModule } from 'app/shared/fuse-shared.module';
import { CustomAutocompleteComponent } from './custom-autocomplete.component';

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
    , PipeModule
    , MatButtonModule 
    , MatIconModule
  ]
})
export class CustomAutocompleteModule { }
