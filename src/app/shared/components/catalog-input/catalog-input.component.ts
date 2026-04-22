import { Component, ViewEncapsulation, Input, Output, EventEmitter, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { CatalogComService } from '../catalog/com-service.service';
import { UntypedFormGroup } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';

@Component({
  selector: 'catalog-input',
  templateUrl: './catalog-input.component.html',
  styleUrls: ['./catalog-input.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations   : fuseAnimations
})
export class CatalogInputComponent implements OnInit, OnDestroy{
  @Input() label: string = 'Input';
  @Input() controlName: string;
  @Input() required: boolean = false;
  @Input() maxlength: number;
  @Input() type: string = 'text';
  @Input() disabled: boolean = false;

  private _unsubscribeAll = new Subject();
  catalogForm: UntypedFormGroup;

  constructor(
    private _comService: CatalogComService
  ){
  }

  /**
   * On Destroy 
   */
  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  
  ngOnInit(){
    this._comService
        .onFormChange
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(form => this.catalogForm = form);
        
    this._comService.addControl(this.controlName, null, this.required, false);
  }
}