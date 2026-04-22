import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { DatePipe, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { Observable, BehaviorSubject } from 'rxjs';
import { ExportToCsv } from 'export-to-csv';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import 'rxjs/add/observable/of';
import { of } from 'rxjs';

@Component({
  selector: 'app-data-viewer',
  templateUrl: './data-viewer.component.html',
  styleUrls: ['./data-viewer.component.scss']
})
export class DataViewerComponent implements OnInit {
  @Input() $data: Observable<any>;
  @Input() data: any[];
  @Input() columnsConfig : any[];
  @Input() options: any;
  @Input() subject: BehaviorSubject<any>;

  @ViewChild('tablePaginator') paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  keywordCtrl: UntypedFormControl;
  dataSource: MatTableDataSource<any>;
  columns$: Observable<any>;
  cols: any[];
  private _defaultOptions: any;

  constructor() {
    this.columnsConfig = Object.assign([], this.columnsConfig);
    this._defaultOptions = {
      showTotals: false,
      pageSize: 5,
      filterLabel: 'Buscar...',
      showFilter: true,
      exportable: true
    };
    
    this.columns$ = of([]);
    this.keywordCtrl = new UntypedFormControl('');

    this.keywordCtrl
      .valueChanges
      .subscribe(keyword => {
        if (!this.dataSource) return;
        this.dataSource.filter = keyword.trim().toLowerCase();
        if (this.dataSource && this.dataSource.paginator)
          this.dataSource.paginator.firstPage();
      });

  }

  ngOnInit() {
    this.options = Object.assign(this._defaultOptions, this.options);
    if(this.$data){
      this.$data
          .subscribe(d => {
            this.data = d;
            this._buildTable();
          });
    }else if(this.data){
      this._buildTable();
    }
  }

  private _buildTable(){
    if (!this.data || !this.data.length){
      this.dataSource = new MatTableDataSource([]);
      return;
    }
    this.cols = Object.getOwnPropertyNames(this.data[0]);
    this.columns$ = of(this.cols);
    this.dataSource = new MatTableDataSource(this.data);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  getColumnHeader(columnName: string){
    if (!this.columnsConfig || !this.columnsConfig.length)
      return columnName.charAt(0).toUpperCase() + columnName.slice(1);
    
    let config = this.columnsConfig.find(x => x.name == columnName);
    return (!config || !config.label) ? columnName : config.label;
  }

  getElement(value: any, columnName: string){
    if (!this.columnsConfig || !this.columnsConfig.length)
      return value;
      
    let config = this.columnsConfig.find(x => x.name == columnName);
    if (!config || !config.format)
      return value;
    
    switch(config.format){
      case 'date':
        return new DatePipe('en-US').transform(value, 'dd/MM/yyyy');
      case 'currency':
        return new CurrencyPipe('en-US').transform(value);
      case 'number':
        return new DecimalPipe('en-US').transform(value, '1.0-2');
      case 'percent':
        return new PercentPipe('en-US').transform(value, '1.2-2');
    }
  }

  getTotal(columnName: string) : number{
    if (!this.columnsConfig || !this.columnsConfig.length)
      return null;
    
    let config = this.columnsConfig.find(x => x.name == columnName);
    return (!config || !config.totalize) 
      ? null 
      : this.dataSource.data.map(x => x[columnName]).reduce((a, b) => a + b);
  }
  
  clearFilter(){
    this.keywordCtrl.setValue('');
  }

  downloadXls() {
    if (this.dataSource.data && this.dataSource.data.length) {
      let currentDate = new DatePipe('en-Us').transform(new Date(), 'yyyy-MM-ddTHHmmss');
      let label =  (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1).toString();
      let options = {
        fieldSeparator: ',',
        quoteStrings: '"',
        decimalSeparator: '.',
        showLabels: true,
        showTitle: false,
        title: `${label}`,
        filename: `${label}-${currentDate}`,
        useTextFile: false,
        useBom: true,
        useKeysAsHeaders: true,
        // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
      };
      let csvExporter = new ExportToCsv(options);
      csvExporter.generateCsv(this.dataSource.data);
    }
  }
}
