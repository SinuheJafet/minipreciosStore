import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, OnChanges } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { UntypedFormControl, FormGroup } from '@angular/forms';
import { startWith, map, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash';
import { __values } from 'tslib';

@Component({
  selector: 'app-custom-autocomplete',
  templateUrl: './custom-autocomplete.component.html',
  styleUrls: ['./custom-autocomplete.component.scss']
})
export class CustomAutocompleteComponent implements OnInit, OnDestroy, OnChanges {
  @Input() label: string;
  @Input() data: Observable<any>;
  @Input() showPropertyName: string;
  @Input() valuePropertyName: string;
  @Input() appearance: 'legacy' | 'standard' | 'fill' | 'outline' = 'outline';
  @Input() control: UntypedFormControl;
  @Input() displayFn: any = null;
  @Input() optionAppearence: 'only-show' | 'value-show' = 'only-show';
  @Input() focusInitial: boolean = false;
  @Input() templatePropertyName: string = null;
  @Input() clearAfterSelect: boolean = false;
  @Input() optionAny: boolean = false;
  @Input() isDisabled: boolean = false;

  @Output() optionSelected: EventEmitter<any> = new EventEmitter();

  list: any[];
  inputCtrl = new UntypedFormControl();
  filteredList: Observable<any[]>;
  selected: boolean = false;

  private _unsuscribeAll: Subject<any> = new Subject();

  ngOnDestroy(): void {
    this._unsuscribeAll.next(null);
    this._unsuscribeAll.complete();
  }

  constructor() {
    if (!this.displayFn){
      this.displayFn = (item?: any): string | undefined => {
        return item
          ? this.optionAppearence == "value-show"
            ? `[${item[this.valuePropertyName]}] - ${item[this.showPropertyName]}`
            : item[this.showPropertyName]
          : undefined;
      }
    }

  }
  
  ngOnInit() {    
    this.data.subscribe(l => {      

      if (this.optionAny && !l.find(i => i[this.valuePropertyName] === 0))
        l.push({ [this.valuePropertyName]: 0, [this.showPropertyName]: 'Ninguno' });

      if (this.optionAppearence == 'only-show')
        this.list = l;
      else
        this.list = _.orderBy(l, [this.valuePropertyName], ["asc"]);

      if (this.displayFn)
        this.filteredList = this.inputCtrl.valueChanges
          .pipe(
            startWith(''),
            map(value => typeof value === 'string' ? value : value[this.showPropertyName]),
            map(prop => prop ? this._filter(prop) : this.list.slice())
          );
      else
        this.filteredList = this.inputCtrl.valueChanges
          .pipe(
            startWith(''),
            map(prop => prop ? this._filter(prop) : this.list.slice())
          );

      this._selectValue(this.control.value);
    });

    if (this.isDisabled)
      this.inputCtrl.disable();

    this.control      
        .valueChanges
        .pipe(takeUntil(this._unsuscribeAll))
        .subscribe(v => {
          this.inputCtrl.setValue('');
          this.selected = false;
          
          if (!v) return;
          this._selectValue(v);
        });
  }

  ngOnChanges(changes: import("@angular/core").SimpleChanges): void {
    this._selectValue(this.control.value);    
  }

  changeValue(){
    this._selectValue(this.control.value);
  }

  onOptionSelected(ev: any) {
    var selectedOption = ev.option.value;
    if (selectedOption) {

      this.selected = true;      
      this.control.markAsDirty();

      if (this.control)
        this.control.patchValue(selectedOption[this.valuePropertyName]);

      if (this.optionSelected)
        this.optionSelected.emit(selectedOption);
    }
    if (this.clearAfterSelect === true)
      this.inputCtrl.setValue('');
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
    return value.toLowerCase().replace(/\s/g, '');
  }

  private _selectValue(val: number) {
    if (!this.list) return;
    let option = this.list.find(x => x[this.valuePropertyName] == val);
    if (option) {
      this.inputCtrl.setValue(option);
      this.selected = true;
    }
  }

  clear() {
    this.selected = false;
    this.inputCtrl.setValue('');
    this.control.setValue('');
    this.control.markAsDirty();
  }
}
