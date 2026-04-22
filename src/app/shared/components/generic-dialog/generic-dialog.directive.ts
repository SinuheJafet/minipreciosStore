import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[genericDialogHost]'  
  , exportAs: 'genericDialogDirective'
})
export class GenericDialogDirective {

  constructor(
    public viewContainerRef: ViewContainerRef
  ) { }

}
