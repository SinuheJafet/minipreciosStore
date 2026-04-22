import { NgModule } from '@angular/core';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FuseSharedModule } from 'app/shared/fuse-shared.module';
import { CatalogSelectComponent } from './catalog-select.component';
import { CatalogSelectService } from './catalog-select.service';

@NgModule({
    declarations: [
        CatalogSelectComponent,
    ],
    imports     : [
        MatSelectModule,
        MatFormFieldModule,
        FuseSharedModule,
        MatOptionModule
    ],
    exports:[
        CatalogSelectComponent,
    ],
    providers: [
        CatalogSelectService
    ]
})
export class CatalogSelectModule
{
}
