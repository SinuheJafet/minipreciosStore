import { Component, ViewEncapsulation, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { CatalogSelectService } from './catalog-select.service';
import { takeUntil } from 'rxjs/operators';
import { CatalogComService } from '../catalog/com-service.service';
import { UntypedFormGroup } from '@angular/forms';
import * as _ from 'lodash';
import { fuseAnimations } from '@fuse/animations';

@Component({
  selector: 'catalog-select',
  templateUrl: './catalog-select.component.html',
  styleUrls: ['./catalog-select.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations   : fuseAnimations
})
export class CatalogSelectComponent implements OnInit, OnDestroy {
  @Input() label: string = 'Opciones';
  @Input() controlName: string;
  @Input() required: boolean = false;
  @Input() itemsApiMehod: string;
  
  items: any[];
  private _unsubscribeAll = new Subject();
  catalogForm: UntypedFormGroup;

  /**
   * Constructor  
   * @param _itemsService Catalog Selec Service 
   * @param _comService Communication Service
   */
  constructor (
    private _itemsService: CatalogSelectService,
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

  /**
   * On Init
   */
  ngOnInit(): void{
    this._itemsService
      .onItemsChange
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(items => this.items = _.sortBy(items.filter(a => a.isActive == true),'name','asc'));
    this._itemsService.getAll(this.itemsApiMehod);

    this._comService
        .onFormChange
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(form => this.catalogForm = form);
    this._comService.addControl(this.controlName, null, );
  }
}