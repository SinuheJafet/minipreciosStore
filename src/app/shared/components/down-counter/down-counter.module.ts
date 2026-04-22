import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DownCounterComponent } from './down-counter.component';



@NgModule({
  declarations: [
    DownCounterComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [DownCounterComponent]
})
export class DownCounterModule { }
