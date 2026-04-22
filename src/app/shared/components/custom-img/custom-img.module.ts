import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomImgComponent } from './custom-img.component';

@NgModule({
  declarations: [
    CustomImgComponent
  ],
  exports: [
    CustomImgComponent
  ],
  imports: [
    CommonModule
  ]
})
export class CustomImgModule { }
