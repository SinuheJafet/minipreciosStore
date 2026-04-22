//import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, ComponentFactoryResolver, Inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GenericDialogOptions } from './generic-dialog-entities/generic-dialog-options';
import { GenericDialogDirective } from './generic-dialog.directive';
import { IGenericDialog } from './generic-dialog.inteface';

@Component({
  selector: 'app-generic-dialog',
  templateUrl: './generic-dialog.component.html',
  styleUrls: ['./generic-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GenericDialogComponent implements OnInit {

  // VIEWCHILDS
  @ViewChild('genericDialogDirective', { static: true }) genericDialogDirective: GenericDialogDirective;  
  // END VIEWCHILDS

  // PUBLIC
  title: String = "NOT TITLE";
  component: any;
  data: any;
  actions: any[] = [];
  options: GenericDialogOptions; 
  // END PUBLIC  

  constructor(
    public _matDialogRef: MatDialogRef<GenericDialogComponent>
    , @Inject(MAT_DIALOG_DATA) public _data: any
    , private _componentFactoryResolver: ComponentFactoryResolver 
  ) {
    this.component = this._data.component;
    this.title = this._data.title;
    this.data = this._data.data;
    this.options = this._data.options;
  }

  ngOnInit() {
    this.loadComponent();    
  }

  loadComponent() {
    const componentFactory =
      this._componentFactoryResolver.resolveComponentFactory<IGenericDialog>(this.component);
    
    const viewContainerRef = this.genericDialogDirective.viewContainerRef;
    viewContainerRef.clear();

    const componentRef = viewContainerRef.createComponent<IGenericDialog>(componentFactory);

    //SETTING COMPONENT
    if (this.data)
      componentRef.instance.data = this.data;

    this.actions = componentRef.instance.actions

    componentRef.instance.eventClose.subscribe(c => {
      this._matDialogRef.close(c);
    })
    //END SETTING COMPONENT
  }
}
