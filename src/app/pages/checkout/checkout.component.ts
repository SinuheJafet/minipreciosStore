import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { Cart } from '../../models/cart.model';
import { AuthService } from '../../services/auth.service';
import { OrdersAdminService } from '../admin/services/orders-admin.service';
import { RealtimeService } from '../../services/realtime.service';

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
  paymentMethod = 'card';

  shippingForm!: FormGroup;
  paymentForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private router: Router,
    private ordersService: OrdersAdminService,
    private authService: AuthService,
    private rt: RealtimeService,
  ) {}

  ngOnInit(): void {
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      if (cart.items.length === 0 && !this.orderPlaced) {
        this.router.navigate(['/cart']);
      }
    });

    this.shippingForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\s]{9,15}$/)]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],
      country: ['España', Validators.required],
    });

    this.paymentForm = this.fb.group({
      cardName: ['', Validators.required],
      cardNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{16}$/)]],
      expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/[0-9]{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^[0-9]{3,4}$/)]],
    });
  }

  nextStep(): void {
    if (this.step === 1 && this.shippingForm.valid) this.step = 2;
    else if (this.step === 2) this.step = 3;
  }

  prevStep(): void {
    if (this.step > 1) this.step--;
  }

  placeOrder(): void {
    if (this.paymentMethod === 'card' && this.paymentForm.invalid) return;
    const s = this.shippingForm.value;
    const dto = {
      items: this.cart.items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
      shipping: {
        fullName: s.fullName, email: this.authService.currentUser?.email || s.email,
        phone: s.phone, address: s.address, city: s.city,
        state: s.state, zip: s.zipCode, country: s.country,
      },
      paymentMethod: this.paymentMethod,
      couponCode: this.cart.couponCode,
    };
    this.orderError = '';
    this.ordersService.placeOrder(dto).subscribe({
      next: (res) => {
        this.orderId = res?.id?.toString() ?? '';
        this.orderPlaced = true;
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

  formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 16);
    this.paymentForm.get('cardNumber')?.setValue(input.value, { emitEvent: false });
  }
}
