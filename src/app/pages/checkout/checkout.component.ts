import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { Cart } from '../../models/cart.model';
import { AuthService } from '../../services/auth.service';
import { OrdersAdminService } from '../admin/services/orders-admin.service';
import { RealtimeService } from '../../services/realtime.service';
import { ProfileService } from '../../services/profile.service';
import { Address } from '../../models/user.model';
import { PaymentAccount } from '../../models/payment-account.model';
import { PaymentAccountsService } from '../../services/payment-accounts.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  cart!: Cart;
  step = 1;
  orderPlaced = false;
  orderError = '';
  orderId = '';
  paymentMethod = 'bank_transfer';
  isLoggedIn = false;
  proofError = '';
  proofSuccess = '';
  proofFile: File | null = null;
  proofPreviewUrl: string | null = null;
  uploadingProof = false;
  isProofDragActive = false;

  // Saved data
  savedAddresses: Address[] = [];
  paymentAccounts: PaymentAccount[] = [];
  selectedAddressId: number | null = null;
  useNewAddress = false;

  shippingForm!: FormGroup;

  readonly countries = ['México', 'España', 'Colombia', 'Argentina', 'Estados Unidos'];

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private router: Router,
    private ordersService: OrdersAdminService,
    private authService: AuthService,
    private rt: RealtimeService,
    private profileService: ProfileService,
    private paymentAccountsService: PaymentAccountsService,
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn;

    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      if (cart.items.length === 0 && !this.orderPlaced) {
        this.router.navigate(['/cart']);
      }
    });

    this.shippingForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: [this.authService.currentUser?.email ?? '', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\s]{9,15}$/)]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern(/^[0-9]{4,6}$/)]],
      country: ['México', Validators.required],
    });

    this.paymentAccountsService.getPublicAccounts().subscribe(list => {
      this.paymentAccounts = (list || []).filter(x => x.isActive);
    });

    if (this.isLoggedIn) {
      this.profileService.getAddresses().subscribe(list => {
        this.savedAddresses = list;
        const def = list.find(a => a.isDefault) ?? list[0];
        if (def) {
          this.selectedAddressId = def.id ?? null;
          this.useNewAddress = false;
        } else {
          this.useNewAddress = true;
        }
      });
    } else {
      this.useNewAddress = true;
    }
  }

  selectAddress(addr: Address): void {
    this.selectedAddressId = addr.id ?? null;
    this.useNewAddress = false;
  }

  get shippingValid(): boolean {
    if (this.isLoggedIn && !this.useNewAddress && this.selectedAddressId) return true;
    return this.shippingForm.valid;
  }

  get paymentValid(): boolean {
    return true;
  }

  nextStep(): void {
    if (this.step === 1 && this.shippingValid) this.step = 2;
    else if (this.step === 2 && this.paymentValid) this.step = 3;
  }

  prevStep(): void {
    if (this.step > 1) this.step--;
  }

  get selectedAddress(): Address | null {
    return this.savedAddresses.find(a => a.id === this.selectedAddressId) ?? null;
  }

  get defaultPaymentAccount(): PaymentAccount | null {
    if (!this.paymentAccounts.length) return null;
    return this.paymentAccounts.find(a => a.isDefault) ?? this.paymentAccounts[0];
  }

  placeOrder(): void {
    if (!this.shippingValid || !this.paymentValid) return;

    let shippingData: { fullName: string; email: string; phone: string; address: string; city: string; state: string; zip: string; country: string; };

    if (this.isLoggedIn && !this.useNewAddress && this.selectedAddress) {
      const a = this.selectedAddress;
      shippingData = {
        fullName: a.fullName,
        email: this.authService.currentUser?.email ?? '',
        phone: a.phone,
        address: a.address,
        city: a.city,
        state: a.state,
        zip: a.zipCode,
        country: a.country,
      };
    } else {
      const s = this.shippingForm.value;
      shippingData = {
        fullName: s.fullName,
        email: this.authService.currentUser?.email || s.email,
        phone: s.phone,
        address: s.address,
        city: s.city,
        state: s.state,
        zip: s.zipCode,
        country: s.country,
      };
    }

    const dto = {
      items: this.cart.items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
      shipping: shippingData,
      paymentMethod: this.paymentMethod,
      couponCode: this.cart.couponCode,
    };

    this.orderError = '';
    this.ordersService.placeOrder(dto).subscribe({
      next: (res) => {
        this.orderId = res?.id?.toString() ?? '';
        this.orderPlaced = true;
        this.proofFile = null;
        this.proofError = '';
        this.proofSuccess = '';
        this.cartService.clearCart();
        if (this.orderId) {
          this.rt.invoke('SubscribeToOrder', this.orderId);
        }
      },
      error: (err) => {
        const status = err?.status;
        if (status === 401) {
          this.orderError = 'Debes iniciar sesión para realizar un pedido.';
        } else if (status === 400) {
          this.orderError = err?.error?.message ?? 'Datos del pedido incorrectos. Revisa el carrito.';
        } else {
          this.orderError = 'No se pudo procesar el pedido. Inténtalo de nuevo.';
        }
      },
    });
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
    if (!this.orderId || !this.proofFile || this.uploadingProof) return;

    this.uploadingProof = true;
    this.proofError = '';
    this.proofSuccess = '';

    const selectedPreview = this.proofPreviewUrl;
    this.ordersService.uploadPaymentProof(this.orderId, this.proofFile).subscribe(ok => {
      this.uploadingProof = false;
      if (!ok) {
        this.proofError = 'No pudimos subir tu comprobante. Verifica que el backend tenga activo POST /api/orders/{id}/payment-proof.';
        return;
      }

      this.proofSuccess = 'Comprobante enviado correctamente. Revisaremos tu pago y marcaremos el pedido como pagado.';
      this.proofFile = null;

      this.ordersService.getMyOrderById(this.orderId).subscribe(detail => {
        if (detail?.paymentProofUrl) {
          this.clearProofPreview();
          this.proofPreviewUrl = detail.paymentProofUrl;
          return;
        }
        this.proofPreviewUrl = selectedPreview;
      });
    });
  }

  private clearProofPreview(): void {
    if (!this.proofPreviewUrl) return;
    if (this.proofPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.proofPreviewUrl);
    }
    this.proofPreviewUrl = null;
  }
}
