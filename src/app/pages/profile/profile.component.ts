import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { Address, SavedCard, User } from '../../models/user.model';
import { Router } from '@angular/router';

type ProfileTab = 'info' | 'addresses' | 'cards';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  activeTab: ProfileTab = 'info';
  currentUser: User | null = null;

  // Info
  infoForm!: FormGroup;
  infoSaving = false;
  infoSuccess = '';
  infoError = '';

  // Addresses
  addresses: Address[] = [];
  addressLoading = false;
  showAddressForm = false;
  editingAddress: Address | null = null;
  addressForm!: FormGroup;
  addressSaving = false;
  addressError = '';

  // Cards
  cards: SavedCard[] = [];
  cardLoading = false;
  showCardForm = false;
  cardForm!: FormGroup;
  cardSaving = false;
  cardError = '';

  readonly countries = ['México', 'España', 'Colombia', 'Argentina', 'Estados Unidos'];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/auth']);
      return;
    }
    this.currentUser = this.authService.currentUser;

    this.infoForm = this.fb.group({
      name:            [this.currentUser?.name ?? '', [Validators.required, Validators.minLength(2)]],
      email:           [this.currentUser?.email ?? '', [Validators.required, Validators.email]],
      currentPassword: [''],
      newPassword:     ['', [Validators.minLength(6)]],
    });

    this.addressForm = this.buildAddressForm();
    this.cardForm    = this.buildCardForm();

    this.loadAddresses();
    this.loadCards();
  }

  // ── Tabs ────────────────────────────────────────────────────────────────────

  setTab(tab: ProfileTab): void {
    this.activeTab = tab;
  }

  // ── Info ────────────────────────────────────────────────────────────────────

  saveInfo(): void {
    if (this.infoForm.invalid) return;
    this.infoSaving = true;
    this.infoSuccess = '';
    this.infoError   = '';

    const v = this.infoForm.value;
    const dto: Record<string, string> = { name: v.name, email: v.email };
    if (v.newPassword) {
      dto['currentPassword'] = v.currentPassword;
      dto['newPassword']     = v.newPassword;
    }

    this.profileService.updateProfile(dto).subscribe(res => {
      this.infoSaving = false;
      if (res) {
        this.infoSuccess = 'Datos actualizados correctamente.';
        this.infoForm.patchValue({ currentPassword: '', newPassword: '' });
      } else {
        this.infoError = 'Error al guardar. Verifica tu contraseña actual.';
      }
    });
  }

  // ── Addresses ───────────────────────────────────────────────────────────────

  private loadAddresses(): void {
    this.addressLoading = true;
    this.profileService.getAddresses().subscribe(list => {
      this.addresses    = list;
      this.addressLoading = false;
    });
  }

  private buildAddressForm(a?: Address): FormGroup {
    return this.fb.group({
      fullName: [a?.fullName ?? '', Validators.required],
      phone:    [a?.phone    ?? '', [Validators.required, Validators.pattern(/^[0-9+\s]{9,15}$/)]],
      address:  [a?.address  ?? '', Validators.required],
      city:     [a?.city     ?? '', Validators.required],
      state:    [a?.state    ?? '', Validators.required],
      zipCode:  [a?.zipCode  ?? '', [Validators.required, Validators.pattern(/^[0-9]{4,6}$/)]],
      country:  [a?.country  ?? 'México', Validators.required],
    });
  }

  openAddressForm(addr?: Address): void {
    this.editingAddress  = addr ?? null;
    this.addressForm     = this.buildAddressForm(addr);
    this.showAddressForm = true;
    this.addressError    = '';
  }

  cancelAddressForm(): void {
    this.showAddressForm = false;
    this.editingAddress  = null;
  }

  saveAddress(): void {
    if (this.addressForm.invalid) return;
    this.addressSaving = true;
    this.addressError  = '';

    const data = this.addressForm.value as Omit<Address, 'id'>;
    const obs$ = this.editingAddress?.id
      ? this.profileService.updateAddress(this.editingAddress.id, data)
      : this.profileService.addAddress(data);

    obs$.subscribe(res => {
      this.addressSaving = false;
      if (res) {
        this.showAddressForm = false;
        this.editingAddress  = null;
        this.loadAddresses();
      } else {
        this.addressError = 'Error al guardar la dirección.';
      }
    });
  }

  deleteAddress(id: number): void {
    if (!confirm('¿Eliminar esta dirección?')) return;
    this.profileService.deleteAddress(id).subscribe(() => this.loadAddresses());
  }

  setDefaultAddress(id: number): void {
    this.profileService.setDefaultAddress(id).subscribe(() => this.loadAddresses());
  }

  // ── Cards ────────────────────────────────────────────────────────────────────

  private loadCards(): void {
    this.cardLoading = true;
    this.profileService.getSavedCards().subscribe(list => {
      this.cards       = list;
      this.cardLoading = false;
    });
  }

  private buildCardForm(): FormGroup {
    return this.fb.group({
      cardName:   ['', Validators.required],
      cardNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{16}$/)]],
      expiry:     ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/[0-9]{2}$/)]],
      cvv:        ['', [Validators.required, Validators.pattern(/^[0-9]{3,4}$/)]],
    });
  }

  openCardForm(): void {
    this.cardForm    = this.buildCardForm();
    this.showCardForm = true;
    this.cardError   = '';
  }

  cancelCardForm(): void {
    this.showCardForm = false;
  }

  saveCard(): void {
    if (this.cardForm.invalid) return;
    this.cardSaving = true;
    this.cardError  = '';

    const v = this.cardForm.value;
    const cardData: Omit<SavedCard, 'id'> = {
      cardName: v.cardName,
      last4:    (v.cardNumber as string).slice(-4),
      brand:    this.detectBrand(v.cardNumber),
      expiry:   v.expiry,
    };

    this.profileService.addCard(cardData).subscribe(res => {
      this.cardSaving = false;
      if (res) {
        this.showCardForm = false;
        this.loadCards();
      } else {
        this.cardError = 'Error al guardar la tarjeta.';
      }
    });
  }

  deleteCard(id: number): void {
    if (!confirm('¿Eliminar esta tarjeta?')) return;
    this.profileService.deleteCard(id).subscribe(() => this.loadCards());
  }

  setDefaultCard(id: number): void {
    this.profileService.setDefaultCard(id).subscribe(() => this.loadCards());
  }

  private detectBrand(number: string): string {
    if (/^4/.test(number))      return 'visa';
    if (/^5[1-5]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number))  return 'amex';
    return 'other';
  }

  brandIcon(brand: string): string {
    const map: Record<string, string> = {
      visa: '💳', mastercard: '💳', amex: '💳', other: '💳',
    };
    return map[brand] ?? '💳';
  }

  formatCardInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 16);
    this.cardForm.get('cardNumber')?.setValue(input.value, { emitEvent: false });
  }
}
