import { Component, OnInit, AfterViewInit, ViewChild, Input, Output, EventEmitter, ElementRef, OnDestroy, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ColumnSource } from './dynamic-table.entities';
import { UntypedFormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortable } from '@angular/material/sort';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';

@Component({
  selector: 'dynamic-table',
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DynamicTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('TABLE') table!: ElementRef;

  @Input('canFilter') canFilter: boolean = false;
  @Input('canAddItem') canAddItem: boolean = false;
  @Input('addText') addText: string = 'Agregar';
  @Input('columns') columns: ColumnSource[] = [];
  @Input('data') data!: Observable<any[]>;
  @Input('pageSize') pageSize: number = 10;
  @Input('hidePaginator') hidePaginator: boolean = false;
  @Input('allowXlsExport') allowXlsExport: boolean = false;
  @Input('tableClassName') tableClassName: string = 'data-table';
  @Input('defaultSortColumn') defaultSortColumn: string | null = null;
  @Input('filterControl') filterControl: UntypedFormControl | null = null;
  @Input('isSelectable') isSelectable: boolean = true;
  @Input('hideHeader') hideHeader: boolean = false;
  @Input('loading') loading: boolean = false;
  @Input('emptyLabel') emptyLabel: string = 'No hay datos a mostrar';
  @Input('addIcon') addIcon: string = 'add';
  @Input('addTooltip') addTooltip: string = 'Nuevo';
  @Input('pageSizeOptions') pageSizeOptions: any[] = [5, 10, 25, 50, 100];
  @Input('filterDisabled') filterDisabled: boolean = false;
  @Input('filterTitle') filterTitle: string = 'Buscar';
  @Input('serverLoading') serverLoading: boolean = false;
  @Input('total') total: number = 0;
  @Input('resetPaginator') resetPaginator!: Observable<boolean>;
  @Input('addStyle') addStyle: 'button' | 'icon' = 'icon';
  @Input('hidePageSizeSelector') hidePageSizeSelector: boolean = false;

  @Input('checkable') checkable: boolean = false;
  @Input('rowIdKey') rowIdKey: string = 'id';

  @Output() onSelectItem: EventEmitter<any> = new EventEmitter<any>();
  @Output() addItem: EventEmitter<any> = new EventEmitter<any>();
  @Output() customFilter: EventEmitter<any> = new EventEmitter<any>();
  @Output() getPage: EventEmitter<any> = new EventEmitter<any>();
  @Output() onDblClick: EventEmitter<any> = new EventEmitter<any>();
  @Output() checkedChange: EventEmitter<any[]> = new EventEmitter<any[]>();

  @ViewChild('tablePaginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filter: string = '';
  displayedColumns: string[] = [];
  checkedSet: Set<any> = new Set();
  /* Single dataSource instance — only .data is updated, never recreated */
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  selectedRow: any;
  filterInputControl: UntypedFormControl;
  private _unsuscribeAll: Subject<any> = new Subject();

  serverPageSize!: UntypedFormControl;
  itemsPerPage: any[] = [];
  offset: number = 0;
  limit: number = 0;
  screenW: number = 0;
  screenH: number = 0;
  isResponsive: boolean = false;

  constructor(
    private matPaginatorIntl: MatPaginatorIntl,
    private cdr: ChangeDetectorRef,
  ) {
    this.filterInputControl = new UntypedFormControl('');
    this.setLanguagePaginator();
  }

  setLanguagePaginator() {
    this.matPaginatorIntl.itemsPerPageLabel = 'Registros por Página';
    this.matPaginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0) return `0 de ${length}`;
      length = Math.max(length, 0);
      const startIndex = page * pageSize;
      const endIndex = startIndex < length
        ? Math.min(startIndex + pageSize, length)
        : startIndex + pageSize;
      return `${startIndex + 1}-${endIndex} de ${length}`;
    };
  }

  ngOnDestroy(): void {
    this._unsuscribeAll.next(null);
    this._unsuscribeAll.complete();
  }

  updateScreenSize() {
    this.screenW = window.innerWidth;
    this.screenH = window.innerHeight;
    this.isResponsive = this.screenW <= 1280;
  }

  ngOnInit() {
    this.updateScreenSize();
    this.serverPageSize = new UntypedFormControl(this.pageSize);
    this.limit = this.pageSize;
    this.itemsPerPage = this.pageSizeOptions;

    this.serverPageSize.valueChanges.pipe(debounceTime(200)).subscribe(c => {
      this.offset = 0;
      this.limit = c;
      this.getPageEmit();
    });

    this.filterInputControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(keyword => {
        if (!this.serverLoading) {
          if (!this.filterDisabled) {
            this.dataSource.filter = keyword.trim().toLowerCase();
            if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
          } else {
            this.customFilter.emit(keyword.trim().toLowerCase());
          }
        } else {
          this.offset = 0;
          this.limit = this.pageSize;
          this.getPageEmit();
        }
      });

    if (this.filterControl != null) {
      this.filterControl.valueChanges.subscribe(c => this.filterInputControl.setValue(c));
    }

    if (!this.columns) this.columns = [];
    this.displayedColumns = [
      ...(this.checkable ? ['__check'] : []),
      ...this.columns.map(c => c.columnDef),
    ];

    if (!this.data) this.data = new Observable<any[]>();

    if (this.resetPaginator != undefined) {
      this.resetPaginator.subscribe(x => { this.offset = x ? 0 : -1; });
    }
  }

  ngAfterViewInit(): void {
    if (!this.hidePaginator && this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this._defineSort();
    }

    // Defer past ngAfterViewInit so detectChanges() is never called during a lifecycle hook.
    // This prevents the silent suppression of change detection that causes rows to only
    // appear on hover (browser repaint not triggered until user interaction).
    setTimeout(() => {
      this.data.pipe(takeUntil(this._unsuscribeAll)).subscribe(rows => {
        this.dataSource.data = rows ?? [];
        if (this.offset > this.total) this.offset = 0;
        this.cdr.detectChanges();
      });
    });
  }

  private _defineSort(): MatSort {
    const resultSort = this.sort;
    const sortColumnFilter = this.columns.filter(c => c.defaultSort || c.defaultSortDesc);
    if (sortColumnFilter.length > 0) {
      const order = sortColumnFilter[0].defaultSort ? 'desc' : 'asc';
      this.defaultSortColumn = `${sortColumnFilter[0].columnDef}:${order}`;
    }
    if (this.defaultSortColumn && this.sort) {
      let sortColumn = this.defaultSortColumn;
      let sortOrder: 'asc' | 'desc' = 'asc';
      const arr = this.defaultSortColumn.split(':');
      if (arr.length > 1) {
        sortColumn = arr[0];
        sortOrder = arr[1].toLowerCase().trim() === 'desc' ? 'desc' : 'asc';
      }
      this.sort.sort({ id: sortColumn, start: sortOrder } as MatSortable);
    }
    return resultSort;
  }

  // ── Checkbox support ─────────────────────────────────────────────────────
  get allChecked(): boolean {
    return this.dataSource.data.length > 0
      && this.dataSource.data.every(r => this.checkedSet.has(r[this.rowIdKey]));
  }

  isChecked(row: any): boolean { return this.checkedSet.has(row[this.rowIdKey]); }

  toggleCheck(row: any, event: Event): void {
    event.stopPropagation();
    const id = row[this.rowIdKey];
    this.checkedSet.has(id) ? this.checkedSet.delete(id) : this.checkedSet.add(id);
    this.checkedSet = new Set(this.checkedSet);
    this.checkedChange.emit(this.dataSource.data.filter(r => this.checkedSet.has(r[this.rowIdKey])));
  }

  toggleCheckAll(): void {
    if (this.allChecked) {
      this.checkedSet = new Set();
    } else {
      this.checkedSet = new Set(this.dataSource.data.map(r => r[this.rowIdKey]));
    }
    this.checkedChange.emit(this.allChecked
      ? this.dataSource.data.filter(r => this.checkedSet.has(r[this.rowIdKey]))
      : []);
  }

  clearChecked(): void { this.checkedSet = new Set(); this.checkedChange.emit([]); }

  clear() {
    if (this.filterInputControl) this.filterInputControl.setValue('');
    if (this.filterControl) this.filterControl.setValue('');
  }

  newItem() { this.addItem.emit(null); }

  select(item: any) {
    if (!this.isSelectable) return;
    this.selectedRow = item;
    if (item != null) this.onSelectItem.emit(item);
  }

  dblclick(item: any) {
    if (item != null && this.onDblClick) this.onDblClick.emit(item);
  }

  downloadXls() {
    if (!this.dataSource.data?.length) return;
    const visibleCols = this.columns.filter(c => !c.operations);
    const header = visibleCols.map(c => `"${c.headerName.trim()}"`).join(',');
    const rows = this.dataSource.data.map(row =>
      visibleCols.map(col => {
        const val = col.cell ? col.cell(row) : row[col.columnDef];
        return `"${val != null ? val.toString().replace(/"/g, '""').trim() : ''}"`;
      }).join(',')
    );
    const csv = '\uFEFF' + [header, ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new DatePipe('es-ES').transform(new Date(), 'yyyy-MM-ddTHHmmss');
    a.href = url;
    a.download = `export-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  previous() {
    if (this.offset > 0) {
      this.offset -= this.serverPageSize.value;
      this.getPageEmit();
    }
  }

  next() {
    if (this.offset < (this.total - this.serverPageSize.value)) {
      this.offset += this.serverPageSize.value;
      this.getPageEmit();
    }
  }

  getPageEmit() {
    this.getPage.emit({
      limit: this.limit,
      offset: this.offset,
      filter: this.filterInputControl.value.trim().toLowerCase(),
    });
  }
}
