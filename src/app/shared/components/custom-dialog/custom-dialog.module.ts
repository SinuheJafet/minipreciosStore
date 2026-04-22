import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CustomDialogComponent } from './custom-dialog.component';

const routes = [
    {
        path: 'custom-dialog',
        component: CustomDialogComponent
    }
];

@NgModule({
    declarations: [
        CustomDialogComponent        
    ],
    imports: [
        RouterModule.forChild(routes),
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
    ],
    exports: [

    ]
})
export class CustomDialogModule {
}
