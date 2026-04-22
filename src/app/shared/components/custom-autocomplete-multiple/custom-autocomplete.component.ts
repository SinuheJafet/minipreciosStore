import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, OnChanges, ViewChild } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { UntypedFormControl, FormGroup } from '@angular/forms';
import { startWith, map, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';



@Component({
  selector: 'app-custom-autocomplete',
  templateUrl: './custom-autocomplete.component.html',
  styleUrls: ['./custom-autocomplete.component.scss']
})
export class CustomAutocompleteComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('trigger') trigger;

  @Input() label: string;
  @Input() data: Observable<any>;
  @Input() showPropertyName: string;
  @Input() valuePropertyName: string;
  @Input() appearance: 'legacy' | 'standard' | 'fill' | 'outline' = 'outline';
  @Input() control: UntypedFormControl;
  @Input() displayFn: any = null;
  @Input() optionAppearence: 'only-show' | 'value-show' = 'only-show';
  @Input() focusInitial: boolean = false;
  @Input() multiple: boolean = false;
  @ViewChild('autoCompleteInput', { read: MatAutocompleteTrigger })
  autoComplete: MatAutocompleteTrigger;

  @Output() optionSelected: EventEmitter<any> = new EventEmitter();

  list: any[];
  inputCtrl = new UntypedFormControl();
  filteredList: Observable<any[]>;

  selectedOptions: any[] = [];
  multiplePlaceholder = '';
  private _unsuscribeAll: Subject<any> = new Subject();
  private _filteredListData: any[];

  ngOnDestroy(): void {
    this._unsuscribeAll.next(null);
    this._unsuscribeAll.complete();
  }

  constructor() {
    if (!this.displayFn)
      this.displayFn = (item?: any): string | undefined => {
        return item
          ? this.optionAppearence == "value-show"
            ? `[${item[this.valuePropertyName]}] - ${item[this.showPropertyName]}`
            : item[this.showPropertyName]
          : undefined;
      }
  }

  ngOnInit() {
    window.addEventListener('scroll', this.scrollEvent, true);
    this.data
      .subscribe(l => {
        if (this.optionAppearence == 'only-show')
          this.list = l;
        else
          this.list = _.orderBy(l, [this.valuePropertyName], ["asc"]);

        if (this.multiple) {
          this.list = this.list.map(i => ({
            ...i,
            checked: false
          }));
        }

        if (this.displayFn) {
          this.filteredList = this.inputCtrl.valueChanges
            .pipe(
              startWith(''),
              map(value => typeof value === 'string' ? value : ''/*: value[this.showPropertyName] ? value[this.showPropertyName] : ''*/),
              map(prop => prop ? this._filter(prop) : this.list.slice())
            );
          this._configFilteredList();
        } else {
          this.filteredList = this.inputCtrl.valueChanges
            .pipe(
              startWith(''),
              map(prop => prop ? this._filter(prop) : this.list.slice())
            );
          this._configFilteredList();
        }

        if (this.control)
          this._selectValue(this.control.value);

      });

  }

  ngOnChanges(changes: import("@angular/core").SimpleChanges): void {
    if (this.control)
      this._selectValue(this.control.value);
  }

  scrollEvent = (event: any): void => {
    if (this.autoComplete.panelOpen)
      // this.autoComplete.closePanel();
      this.autoComplete.updatePosition();
  }

  onOptionSelected(ev: any) {
    if (!ev.option || !ev.option.value) {
      if (this.optionSelected)
        this.optionSelected.emit(null);
      return;
    }

    if (this.control) {
      if (this.multiple) {
        this._selectOption(ev.option.value);
        this.control.patchValue(this.selectedOptions.map(i => i[this.valuePropertyName]));
      } else {
        this.control.patchValue(ev.option.value[this.valuePropertyName]);
      }
    }

    if (this.optionSelected) {
      if (this.multiple)
        this.optionSelected.emit(this.selectedOptions);
      else
        this.optionSelected.emit(ev.option.value);
    }
  }

  private _filter(value: string): string[] {
    const filterValue = this._normalizeValue(value);
    return this.list.filter(x =>
      this._normalizeValue(
        this.optionAppearence == "value-show"
          ? x[this.valuePropertyName] + x[this.showPropertyName]
          : x[this.showPropertyName]
      ).includes(filterValue));
  }

  private _normalizeValue(value: string): string {
    return value['toLowerCase'] ? value.toLowerCase().replace(/\s/g, '') : '';
  }

  private _selectValue(val: any) {

    if (!this.list)
      return;

    if (this.multiple) {
      let selectedIds = val;
      this.selectedOptions = [];
      if (selectedIds && selectedIds.length) {
        selectedIds.forEach(selectedId => {
          let findedObject = this.list.find(i => i[this.valuePropertyName] == selectedId);
          if (findedObject)
            this._selectOption(findedObject);
        });
      } else {
        this.multiplePlaceholder = '';
        this.list.forEach(i => i.checked = false);
      }

    } else {
      let option = this.list.find(x => x[this.valuePropertyName] == val);
      if (option) {
        this.inputCtrl.setValue(option);
      }
    }
  }

  private _configFilteredList() {
    this.filteredList.subscribe(d => this._filteredListData = d);
  }

  private _selectOption(option: any) {
    option.checked = !option.checked;
    if (option.checked) {
      this.selectedOptions.push(option);
    } else {
      this.selectedOptions.splice(this.selectedOptions.indexOf(option), 1);
    }
    let values = this.selectedOptions.map(i => i[this.valuePropertyName]);
    this.inputCtrl.setValue('');
    let newList = this.list.filter(i => values.indexOf(i[this.valuePropertyName]) == -1);
    this.filteredList = this.inputCtrl.valueChanges
      .pipe(
        startWith(''),
        map(prop => prop ? this._filter(prop) : newList.slice())
      );
    this._configFilteredList();

    this.multiplePlaceholder =
      !this.selectedOptions.length
        ? ''
        : this.selectedOptions.length == 1
          ? '1 seleccionado'
          : `${this.selectedOptions.length} seleccionados`;
  }

  selectAll() {
    if (!this.list.filter(i => !i.checked).length)
      return;
    this.list.filter(i => !i.checked).forEach(option => this._selectOption(option));
    this.control.patchValue(this.selectedOptions.map(i => i[this.valuePropertyName]));
    if (this.optionSelected)
      this.optionSelected.emit(this.selectedOptions);
  }

  deSelectAll() {
    if (!this.list.filter(i => i.checked).length)
      return;
    this.list.filter(i => i.checked).forEach(option => this._selectOption(option));
    this.control.patchValue(this.selectedOptions.map(i => i[this.valuePropertyName]));

    if (this.optionSelected)
      this.optionSelected.emit(this.selectedOptions);
  }

  isAllSelected() {
    return this.list.filter(i => !i.checked).length === 0;
  }

  isAllDeSelected() {
    return this.list.filter(i => i.checked).length === 0;
  }

}
