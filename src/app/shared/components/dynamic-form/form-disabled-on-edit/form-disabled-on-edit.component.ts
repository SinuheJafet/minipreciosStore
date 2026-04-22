import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { DATE_FORMAT } from 'app/shared/constants/globals';
import { ApiService } from 'app/shared/services/api.service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { BaseProperty,  DynamicFormSettings} from '../dynamic-form.entities';
import { FuseScrollbarDirective } from '@fuse/directives/scrollbar/scrollbar.directive';
import { MsgService } from 'app/shared/modules/msg/services/msg.service';
import { FileManagerObject } from 'app/shared/modules/file-manager/entities/file-manager-object.type';

/*
  This component uses property beforeSend to getValue.
*/
@Component({
  selector: 'app-form-disabled-on-edit',
  templateUrl: './form-disabled-on-edit.component.html',
  styleUrls: ['./form-disabled-on-edit.component.scss'],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: DATE_FORMAT },
    { provide: "customService", useClass: ApiService },
  ],
  encapsulation: ViewEncapsulation.None
})
export class FormDisabledOnEditComponent implements OnInit, OnDestroy {

  @Input() properties: BaseProperty[];
  @Input('data') data$: Observable<any>;
  @Input() settings: DynamicFormSettings = {};
  @Output() save: EventEmitter<any> = new EventEmitter();
  @Output() cancel: EventEmitter<any> = new EventEmitter();

  @ViewChildren(FuseScrollbarDirective)
  private _fuseScrollbarDirectives: QueryList<FuseScrollbarDirective>

  filesHandler: any = {};

  ngAfterViewInit(): void {
    // Iterate through the directives and update all of them

    this._fuseScrollbarDirectives.forEach((fuseScrollbarDirective) => {
      fuseScrollbarDirective.update();
    });
    this.boolToInt("true");
  }

  public dynamicFormGroup: UntypedFormGroup;
  public dataIn: any[] = [];
  public isOnEdit: boolean = false;

  public onlyRead: boolean = false;

  private _unsuscribeAll: Subject<any> = new Subject();
  private _defaultSettings: DynamicFormSettings;
  finalSettings: DynamicFormSettings;

  constructor(
    private _formBuilder: UntypedFormBuilder
    , private _msgService: MsgService
    , @Inject("customService") private _customService: ApiService
  ) { 
    this._defaultSettings = {
      confirmOnSave: false
    };
  }

  ngOnDestroy(): void {
    this._unsuscribeAll.next(null);
    this._unsuscribeAll.complete();
  }

  ngOnInit() {
      this.finalSettings = Object.assign(this._defaultSettings, this.settings);
  
      this.initForm(this.properties);
      // this.isOnEdit = this.item != undefined || this.item != null;
  
      this.data$
        .pipe(takeUntil(this._unsuscribeAll))
        .subscribe(data => {      
          this.dynamicFormGroup.reset();
          this.properties.forEach(prop => {
            let control = this.dynamicFormGroup.get(prop.name);
  
            if (control) {
              control.setValue(
                data !== null && prop !== undefined  && prop.name != undefined && data[prop.name] !== undefined
                  ? data[prop.name]
                  : prop ? prop.defaultValue : null
              );
            }
  
            if(prop.type === 'file' && this.filesHandler){
              this.filesHandler[prop.name] = data && data[prop.name] ? data[prop.name] : [];
            }

            if(prop.beforeSend === 'DisabledOnlyEdit') {
              if(data){
                this.dynamicFormGroup.get(prop.name).disable();
              } else {
                this.dynamicFormGroup.get(prop.name).enable();
              }
            }
            
          });
  
        });
    }

    initForm(properties: BaseProperty[]) {
          this.dynamicFormGroup = new UntypedFormGroup({});
      
          properties.forEach((property: BaseProperty) => {
            let control = new UntypedFormControl({ value: null, disabled: this.isOnEdit && property.disabledOnEdit });
            let validators: any[] = [];
      
            if (property.required && property.required == true) {
              validators.push(Validators.required);
            }
      
            if (property.minLength && property.minLength > 0) {
              validators.push(Validators.minLength(property.minLength))
            }
      
            if (property.maxLength && property.maxLength > 0) {
              validators.push(Validators.maxLength(property.maxLength))
            }
            if (property.maxLength && property.maxLength > 0) {
              validators.push(Validators.maxLength(property.maxLength))
            }
      
            if (property.validators && property.validators.length) {
              property.validators.forEach(v => {
                validators.push(v);
              });
            }
      
            if (property.type == 'email') {
              validators.push(Validators.email)
            }
      
            if (property.disabled == true) {
              control.disable();
            }
      
            if (property.type == 'list') {
              this.addData(property);
            }
      
            control.setValidators(validators);
            this.dynamicFormGroup.addControl(property.name, control);
      
          });    
        }
      
        addData(property: BaseProperty) {
          if (property && property.source) {
      
            let data: Observable<any[]>;
            let onDataChange: BehaviorSubject<any[]> = new BehaviorSubject([])
            data = onDataChange.asObservable().pipe(map(l => l.filter(i => i['isActive'] !== undefined ? i.isActive : true)));
            this._customService.get(property.source.apiName, onDataChange, property.source.appUrl);
            this.dataIn.push({ name: property.name, data: data, onDataChange: onDataChange });
          }
        }
    
        getDataByName(name: string): Observable<any[]> {
          let result = null;
          let finded = this.dataIn.find(c => c.name == name);
          if (finded) {
            result = finded.data;
          }
          return result;
        }
      
        public get f(): any {
          return this.dynamicFormGroup.controls;
        }
      
        onClickSave() {
          if (this.finalSettings.confirmOnSave) {
            this._msgService.confirm('¿Guardar Registro?').subscribe(c => {
              if (!c) return;
      
              this._save();
            });
          } else {
            this._save();
          }
        }
      
        private _save() {
      
          let item = this.dynamicFormGroup.getRawValue();
      
          // console.log(item);
      
          this.properties.forEach((prop: BaseProperty) => {
      
            if (typeof item[prop.name] != 'undefined' && item[prop.name] != null) {
      
              let itemToString = item[prop.name].toString();
      
              switch (prop.parseTo) {
                case 'int':
                  if (typeof item[prop.name] === "boolean") {
                    item[prop.name] = this.boolToInt(item[prop.name]);
      
                    // parseInt(itemToString);
      
                  } else if (typeof item[prop.name] === "string") {
                    console.log(`La propiedad: "${item[prop.name]}" no se puede convertir  no es un numero`);
                    item[prop.name] = item[prop.name];
                  }
                  break;
                case 'float':
                  if (typeof item[prop.name] === "string") {
                    console.log(`La propiedad: "${item[prop.name]}" no es un numero`);
                    item[prop.name] = item[prop.name];
                  } else {
                    item[prop.name] = parseFloat(itemToString)
                  }
                  break;
                case 'date':
                  item[prop.name] = new Date(itemToString)
                  break;
                case 'boolean':
                  item[prop.name] = (String(itemToString).toLowerCase() == "true" ? true : false)
                  break;
                case 'string':
                  item[prop.name] = itemToString
                  break;
                default: item[prop.name]
                  break;
              }
      
      
              if (prop.type === 'file'){
                item[prop.name] = this.filesHandler[prop.name];
              }
      
            }
      
          });
      
          if (this.save)
            this.save.emit(item);
        }
      
      
      
        boolToInt(b) {
          return b ? 1 : 0;
        }
      
        onCancel() {
          this.cancel.emit();
        }
      
        onColorChanged(color: any, formControl: any) {
          let colorName = 'accent-600';
          if (color.class != '-')
            colorName = color.class;
          formControl.setValue(colorName);
          formControl.markAsDirty();
        }
      
        onFileUploadComplete(file: FileManagerObject, property: BaseProperty){
          this.dynamicFormGroup.patchValue({
            [property.name]: [this.filesHandler[property.name]]
          });
          if (property.fileUploadComplete)
            property.fileUploadComplete(file);
        }
      
        onFileDeleteComplete(file: FileManagerObject, property: BaseProperty){
          this.dynamicFormGroup.patchValue({
            [property.name]: [this.filesHandler[property.name]]
          });
          if (property.fileDeleteComplete)
            property.fileDeleteComplete(file);
        }
}
