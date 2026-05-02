import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InventoryMovement } from '../../../models/admin.model';
import { ColumnSource } from '../../../shared/components/dynamic-table/dynamic-table.entities';
import { InventoryAdminService } from '../services/inventory-admin.service';
import { RealtimeService } from '../../../services/realtime.service';

@Component({
  selector: 'admin-movements-section',
  templateUrl: './movements-section.component.html',
  styleUrls: ['./movements-section.component.scss']
})
export class MovementsSectionComponent implements OnInit, OnDestroy {
  movements!: Observable<InventoryMovement[]>;
  private destroy$ = new Subject<void>();

  constructor(
    private svc: InventoryAdminService,
    private rt: RealtimeService,
  ) {}

  ngOnInit(): void {
    this.reload();
    // Recargar en tiempo real cuando se crea/modifica un movimiento
    this.rt.on('InventoryChanged')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.reload());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  reload(): void { this.movements = this.svc.getMovements(); }

  columns: ColumnSource[] = [
    { columnDef: 'createdAt', headerName: 'Fecha', cell: (r: InventoryMovement) => r.createdAt.substring(0, 10) },
    { columnDef: 'productName', headerName: 'Producto',
      isHtmlTemplate: true, contentTemplate: (r: InventoryMovement) =>
        `<span style="display:block;font-weight:600;color:#0f172a;font-size:13px">${r.productName}</span>
         <span style="font-family:monospace;font-size:10px;background:#f1f5f9;padding:1px 6px;border-radius:4px;color:#475569">${r.productSku}</span>` },
    { columnDef: 'type', headerName: 'Tipo',
      isHtmlTemplate: true, contentTemplate: (r: InventoryMovement) => {
        const cfg: Record<string,[string,string,string]> = {
          entrada: ['#d1fae5','#059669','↑ Entrada'],
          salida:  ['#fef2f2','#dc2626','↓ Salida'],
          ajuste:  ['#dbeafe','#2563eb','⇄ Ajuste'],
        };
        const [bg, c, lbl] = cfg[r.type] ?? ['#f1f5f9','#64748b', r.type];
        return `<span style="padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;background:${bg};color:${c}">${lbl}</span>`;
      }},
    { columnDef: 'concept',  headerName: 'Concepto', cell: (r: InventoryMovement) => r.concept },
    { columnDef: 'quantity', headerName: 'Cantidad',
      isHtmlTemplate: true, contentTemplate: (r: InventoryMovement) =>
        `<span style="font-weight:700;color:#0f172a">${r.type === 'entrada' ? '+' : r.type === 'salida' ? '-' : ''}${r.quantity}</span>` },
    { columnDef: 'previousStock', headerName: 'Ant.',
      isHtmlTemplate: true, contentTemplate: (r: InventoryMovement) => `<span style="color:#94a3b8;font-size:12px">${r.previousStock}</span>` },
    { columnDef: 'newStock', headerName: 'Nuevo',
      isHtmlTemplate: true, contentTemplate: (r: InventoryMovement) => `<span style="font-weight:600;color:#0f172a;font-size:12px">${r.newStock}</span>` },
    { columnDef: 'createdBy', headerName: 'Registrado por', cell: (r: InventoryMovement) => r.createdBy },
    { columnDef: 'notes', headerName: 'Notas', cell: (r: InventoryMovement) => r.notes || '—' },
  ];
}
