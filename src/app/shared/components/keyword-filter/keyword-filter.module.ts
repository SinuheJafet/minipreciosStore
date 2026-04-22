import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeywordFilterComponent } from './keyword-filter.component';


import { FormsModule } from '@angular/forms';
import { SharedModule } from 'app/shared/shared.module';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [ 
    KeywordFilterComponent
  ],
  exports:[
    KeywordFilterComponent
  ],
  imports: [
    SharedModule,
    FormsModule,
    MatIconModule,
  ]
})
export class KeywordFilterModule { }
