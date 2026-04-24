import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { OrdersAdminService } from '../admin/services/orders-admin.service';
import { AdminOrder } from '../../models/admin.model';
import { RealtimeService } from '../../services/realtime.service';
import { Subscription, interval } from 'rxjs';
import { PaymentAccount } from '../../models/payment-account.model';
import { PaymentAccountsService } from '../../services/payment-accounts.service';

interface OrderStatusEvent { id: string; status: string; trackingNumber?: string; }

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit, OnDestroy {
  orders: AdminOrder[] = [];
  loading = true;
  selectedOrder: AdminOrder | null = null;
  loadingDetail = false;
  proofFile: File | null = null;
  proofPreviewUrl: string | null = null;
  proofUploading = false;
  proofError = '';
  proofSuccess = '';
  isProofDragActive = false;
  paymentAccounts: PaymentAccount[] = [];
  private _subs = new Subscription();
  private subscribedOrderIds = new Set<string>();

  readonly statusLabel: Record<string, string> = {
    pending:    'Pendiente',
    paid:       'Pagado',
    processing: 'En proceso',
    shipped:    'Enviado',
    delivered:  'Entregado',
    cancelled:  'Cancelado',
  };

  readonly paymentLabel: Record<string, string> = {
    bank_transfer: 'Transferencia bancaria',
    card:   'Tarjeta',
    paypal: 'PayPal',
    bizum:  'Bizum',
  };

  readonly proofStatusLabel: Record<string, string> = {
    pending_review: 'En revisión',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private ordersService: OrdersAdminService,
    private rt: RealtimeService,
    private paymentAccountsService: PaymentAccountsService,
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/auth']);
      return;
    }
    this.refreshOrders(true);

    this.paymentAccountsService.getPublicAccounts().subscribe(list => {
      this.paymentAccounts = (list || []).filter(x => x.isActive);
    });

    this._subs.add(
      this.rt.on<OrderStatusEvent>('OrderStatusChanged').subscribe(evt => {
        this.orders = this.orders.map(o =>
          o.id === evt.id
            ? { ...o, status: evt.status as AdminOrder['status'], trackingNumber: evt.trackingNumber ?? o.trackingNumber }
            : o
        );
        if (this.selectedOrder?.id === evt.id) {
          this.selectedOrder = {
            ...this.selectedOrder,
            status: evt.status as AdminOrder['status'],
            trackingNumber: evt.trackingNumber ?? this.selectedOrder.trackingNumber,
          };
        }
      })
    );

    // Fallback when backend does not push realtime status events.
    this._subs.add(interval(7000).subscribe(() => this.refreshOrders(false)));
  }

  openDetail(order: AdminOrder): void {
    this.selectedOrder = order;
    this.proofFile = null;
    this.proofError = '';
    this.proofSuccess = '';
    this.loadingDetail = true;
    this.ordersService.getMyOrderById(order.id).subscribe(detail => {
      if (detail) this.selectedOrder = detail;
      this.loadingDetail = false;
    });
  }

  closeDetail(): void {
    this.clearProofPreview();
    this.selectedOrder = null;
    this.proofFile = null;
    this.proofError = '';
    this.proofSuccess = '';
  }

  get canUploadProof(): boolean {
    if (!this.selectedOrder) return false;
    const isTransfer = this.selectedOrder.paymentMethod === 'bank_transfer';
    const canByStatus = this.selectedOrder.status === 'pending';
    return isTransfer && canByStatus;
  }

  get defaultPaymentAccount(): PaymentAccount | null {
    if (!this.paymentAccounts.length) return null;
    return this.paymentAccounts.find(a => a.isDefault) ?? this.paymentAccounts[0];
  }

  onProofSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.processProofFile(file);
  }

  onProofDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isProofDragActive = true;
  }

  onProofDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isProofDragActive = false;
  }

  onProofDrop(event: DragEvent): void {
    event.preventDefault();
    this.isProofDragActive = false;

    const file = event.dataTransfer?.files?.[0] ?? null;
    this.processProofFile(file);
  }

  private processProofFile(file: File | null): void {
    this.proofError = '';
    this.proofSuccess = '';
    this.clearProofPreview();

    if (!file) {
      this.proofFile = null;
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      this.proofError = 'Formato no permitido. Usa JPG, PNG o PDF.';
      this.proofFile = null;
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.proofError = 'El archivo excede 5 MB.';
      this.proofFile = null;
      return;
    }

    this.proofFile = file;
    this.proofPreviewUrl = URL.createObjectURL(file);
  }

  uploadPaymentProof(): void {
    if (!this.selectedOrder || !this.proofFile || this.proofUploading) return;

    this.proofUploading = true;
    this.proofError = '';
    this.proofSuccess = '';

    const selectedPreview = this.proofPreviewUrl;
    this.ordersService.uploadPaymentProof(this.selectedOrder.id, this.proofFile).subscribe(ok => {
      this.proofUploading = false;
      if (!ok) {
        this.proofError = 'No pudimos subir tu comprobante. Inténtalo de nuevo.';
        return;
      }

      this.proofSuccess = 'Comprobante enviado. Tu pago quedará pendiente de validación por administración.';
      this.proofFile = null;

      if (this.selectedOrder) {
        this.selectedOrder = {
          ...this.selectedOrder,
          paymentProofStatus: 'pending_review',
          paymentProofUrl: selectedPreview ?? this.selectedOrder.paymentProofUrl,
        };

        this.orders = this.orders.map(o =>
          o.id === this.selectedOrder?.id
            ? {
                ...o,
                paymentProofStatus: 'pending_review',
                paymentProofUrl: selectedPreview ?? o.paymentProofUrl,
              }
            : o
        );

        this.ordersService.getMyOrderById(this.selectedOrder.id).subscribe(detail => {
          if (!detail || !this.selectedOrder || detail.id !== this.selectedOrder.id) return;
          this.selectedOrder = detail;
          this.orders = this.orders.map(o => o.id === detail.id ? detail : o);
          if (detail.paymentProofUrl) {
            this.clearProofPreview();
            this.proofPreviewUrl = detail.paymentProofUrl;
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.clearProofPreview();
    this._subs.unsubscribe();
  }

  private clearProofPreview(): void {
    if (!this.proofPreviewUrl) return;
    if (this.proofPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.proofPreviewUrl);
    }
    this.proofPreviewUrl = null;
  }

  private refreshOrders(syncSelected: boolean): void {
    this.ordersService.getMyOrders().subscribe(list => {
      this.orders = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      this.loading = false;

      for (const order of this.orders) {
        if (this.subscribedOrderIds.has(order.id)) continue;
        this.subscribedOrderIds.add(order.id);
        this.rt.invoke('SubscribeToOrder', order.id);
      }

      if (!syncSelected || !this.selectedOrder) return;
      const current = this.orders.find(o => o.id === this.selectedOrder?.id);
      if (current) this.selectedOrder = { ...current };
    });
  }
}
