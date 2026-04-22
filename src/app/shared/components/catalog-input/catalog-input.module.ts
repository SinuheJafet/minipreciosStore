import { NgModule } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FuseSharedModule } from 'app/shared/fuse-shared.module';
import { CatalogInputComponent } from './catalog-input.component';

@NgModule({
    declarations: [
        CatalogInputComponent,
    ],
    imports     : [
        MatFormFieldModule,
        MatInputModule,
        FuseSharedModule,
        
    ],
    exports:[
        CatalogInputComponent,
    ]
})
export class CatalogInputModule
{
}
