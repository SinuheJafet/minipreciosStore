import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentAccount } from '../../../models/payment-account.model';
import { PaymentAccountsService } from '../../../services/payment-accounts.service';

@Component({
  selector: 'admin-payment-accounts-section',
  templateUrl: './payment-accounts-section.component.html',
  styleUrls: ['./payment-accounts-section.component.scss']
})
export class PaymentAccountsSectionComponent implements OnInit {
  accounts: PaymentAccount[] = [];
  loading = false;
  saving = false;
  error = '';
  success = '';
  editingId: number | null = null;

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private service: PaymentAccountsService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      alias: ['', Validators.required],
      bank: ['', Validators.required],
      accountName: ['', Validators.required],
      clabe: ['', [Validators.required, Validators.pattern(/^[0-9]{18}$/)]],
      accountNumber: [''],
      instructions: [''],
      isDefault: [false],
      isActive: [true],
    });

    this.load();
  }

  load(): void {
    this.loading = true;
    this.service.getAdminAccounts().subscribe(list => {
      this.accounts = list;
      this.loading = false;
    });
  }

  edit(account: PaymentAccount): void {
    this.editingId = account.id ?? null;
    this.form.patchValue({
      alias: account.alias,
      bank: account.bank,
      accountName: account.accountName,
      clabe: account.clabe,
      accountNumber: account.accountNumber ?? '',
      instructions: account.instructions ?? '',
      isDefault: account.isDefault,
      isActive: account.isActive,
    });
    this.error = '';
    this.success = '';
  }

  resetForm(): void {
    this.editingId = null;
    this.form.reset({ isDefault: false, isActive: true });
    this.error = '';
    this.success = '';
  }

  save(): void {
    if (this.form.invalid || this.saving) return;

    this.saving = true;
    this.error = '';
    this.success = '';

    const dto = this.form.value as Omit<PaymentAccount, 'id'>;
    const request$ = this.editingId
      ? this.service.updateAccount(this.editingId, dto)
      : this.service.createAccount(dto);

    request$.subscribe(res => {
      this.saving = false;
      if (!res) {
        this.error = 'No se pudo guardar la cuenta bancaria.';
        return;
      }
      this.success = this.editingId ? 'Cuenta actualizada.' : 'Cuenta creada.';
      this.resetForm();
      this.load();
    });
  }

  delete(account: PaymentAccount): void {
    if (!account.id) return;
    if (!confirm(`Eliminar cuenta ${account.alias}?`)) return;

    this.service.deleteAccount(account.id).subscribe(ok => {
      if (!ok) {
        this.error = 'No se pudo eliminar la cuenta.';
        return;
      }
      this.load();
    });
  }

  makeDefault(account: PaymentAccount): void {
    if (!account.id || account.isDefault) return;

    this.service.setDefault(account.id).subscribe(ok => {
      if (!ok) {
        this.error = 'No se pudo marcar como predeterminada.';
        return;
      }
      this.load();
    });
  }
}
