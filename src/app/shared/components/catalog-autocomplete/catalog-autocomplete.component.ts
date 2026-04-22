import { Component, ViewEncapsulation, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { takeUntil, startWith, map } from 'rxjs/operators';
import { CatalogAutocompleteService } from './catalog-autocomplete.service';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { CatalogComService } from '../catalog/com-service.service';
import * as _ from 'lodash';
import { fuseAnimations } from '@fuse/animations';

@Component({
  selector: 'catalog-autocomplete',
  templateUrl: './catalog-autocomplete.component.html',
  styleUrls: ['./catalog-autocomplete.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [CatalogAutocompleteService],
  animations: fuseAnimations
})
export class CatalogAutocompleteComponent implements OnInit, OnDestroy {

  @Input() label: string = 'Opciones';
  @Input() controlName: string;
  @Input() required: boolean = false;
  @Input() itemsApiMehod: string;
  @Input() showPropertyName: string;
  @Input() valuePropertyName: string;
  @Input() displayFn: any = null;
  @Input() optionAppearence: 'only-show' | 'value-show' = 'only-show';
  @Input() templatePropertyName: string = null;
  @Input() optionAny: boolean = false;
  @Input() clearAfterSelect: boolean = false;
  @Input() disabled: boolean = false;
  @Input() mapMethod: any = undefined;


  items: any[];
  private _unsubscribeAll = new Subject();
  catalogForm: UntypedFormGroup;
  filteredItems: Observable<any>;
  keyword: string = '';
  keywordCtrl = new UntypedFormControl();
  selected: boolean = false;
  closeDisabled: boolean = true;

  constructor(
    private _itemsService: CatalogAutocompleteService,
    private _comService: CatalogComService,
  ) {

    if (!this.displayFn)
      this.displayFn = (item?: any): string | undefined => {
        return item
          ? this.optionAppearence == "value-show"
            ? `[${item[this.valuePropertyName]}] - ${item[this.showPropertyName]}`
            : item[this.showPropertyName]
          : undefined;
      }

    this._itemsService
      .onItemsChange
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(items => {
        if (this.optionAny && !items.find(i => i[this.valuePropertyName] === 0))
          items.push({ [this.valuePropertyName]: 0, [this.showPropertyName]: 'Ninguno' });

        if (this.optionAppearence == 'only-show')
          this.items = items;
        else
          this.items = _.orderBy(items, [this.valuePropertyName], ["asc"]);

        if (this.displayFn)
          this.filteredItems = this.keywordCtrl.valueChanges
            .pipe(
              startWith(''),
              map(value => !value ? '' : typeof value === 'string' ? value : value[this.showPropertyName]),
              map(prop => prop ? this._filter(prop) : this.items.slice())
            );
        else
          this.filteredItems = this.keywordCtrl.valueChanges
            .pipe(
              startWith(''),
              map(prop => prop ? this._filter(prop) : this.items.slice())
            );
      });
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
  ngOnInit(): void {

    this._itemsService.getAll(this.itemsApiMehod, this.mapMethod);

    this._comService
      .onFormChange
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(form => {
        this.catalogForm = form;
        this.keywordCtrl.reset();
        this.keywordCtrl.enable();
        this.closeDisabled = false;
        this.selected = false;
        if (this.catalogForm && this.catalogForm.value && this.catalogForm.value[this.controlName] != undefined) {          
          this._selectValue(this.catalogForm.value[this.controlName]);
          if (this.disabled && this.catalogForm.value[this.controlName] > 0) {            
            this.keywordCtrl.disable();
            this.closeDisabled = this.disabled;
          }
        }
      });
    this._comService.addControl(this.controlName, null, this.required, this.disabled);
  }

  private _filter(value: string): string[] {
    let data: any[] = [];
    const filterValue = this._normalizeValue(value);
    if (this.items) {
      data = this.items.filter(x =>
        this._normalizeValue(
          this.optionAppearence == "value-show"
            ? x[this.valuePropertyName] + x[this.showPropertyName]
            : x[this.showPropertyName]
        ).includes(filterValue));
    }
    return data;
  }

  optionSelected(event: any) {
    var selectedOption = event.option.value;
    this.selected = selectedOption != undefined;
    if (this.selected) {
      this.catalogForm.controls[this.controlName].setValue(selectedOption[this.valuePropertyName]);
      this.catalogForm.markAsDirty();
    }
  }

  clear() {
    this.selected = false;
    this.keywordCtrl.setValue('');
    this.catalogForm.controls[this.controlName].setValue('');
    this.catalogForm.markAsDirty();
  }

  private _normalizeValue(value: string): string {
    return value.toLowerCase().replace(/\s/g, '');
  }

  private _selectValue(val: number) {
    if (!this.items) return;
    let option = this.items.find(x => x[this.valuePropertyName] == val);
    if (option) {
      this.keywordCtrl.setValue(option);
      this.selected = true;
    }
  }
}