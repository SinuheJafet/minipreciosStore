import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { Cart } from '../../models/cart.model';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  cart!: Cart;
  step = 1;
  orderPlaced = false;
  orderId = '';
  paymentMethod = 'card';

  shippingForm!: FormGroup;
  paymentForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private router: Router
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
    this.orderId = 'MP-' + Date.now().toString(36).toUpperCase();
    this.orderPlaced = true;
    this.cartService.clearCart();
  }

  formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 16);
    this.paymentForm.get('cardNumber')?.setValue(input.value, { emitEvent: false });
  }
}
