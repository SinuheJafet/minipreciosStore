import { NgModule } from '@angular/core';
import { CatalogAutocompleteComponent } from './catalog-autocomplete.component';
import { CatalogAutocompleteService } from './catalog-autocomplete.service';
import { CatalogComService } from '../catalog/com-service.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PipeModule } from 'app/shared/pipes/pipe.module';
import { FuseSharedModule } from 'app/shared/fuse-shared.module';

@NgModule({
    declarations: [
        CatalogAutocompleteComponent,
    ],
    imports     : [
        MatAutocompleteModule,
        MatInputModule,
        MatFormFieldModule,
        FuseSharedModule,
        MatButtonModule,
        MatIconModule,
        PipeModule
    ],
    exports:[
        CatalogAutocompleteComponent,
    ],
    providers: [
        CatalogAutocompleteService,
        CatalogComService
    ]
})
export class CatalogAutocompleteModule
{
}
