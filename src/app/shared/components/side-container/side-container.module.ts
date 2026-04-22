import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SideContainerComponent } from './side-container.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseSharedModule } from 'app/shared/fuse-shared.module';


@NgModule({
  declarations: [SideContainerComponent],
  imports: [
   FuseSharedModule
    , MatTooltipModule
    , MatIconModule
    , MatButtonModule
    , MatTooltipModule
  ],
  exports:[
    SideContainerComponent
  ]
})
export class SideContainerModule { }
