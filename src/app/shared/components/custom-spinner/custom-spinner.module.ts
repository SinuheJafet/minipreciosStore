import { NgModule } from '@angular/core';
import { CustomSpinnerComponent } from './custom-spinner.component';
import { CommonModule } from '@angular/common';



@NgModule({
  exports: [
    CustomSpinnerComponent
  ],
  declarations: [
    CustomSpinnerComponent
  ],
  imports: [
    CommonModule
  ]
})
export class CustomSpinnerModule { }
