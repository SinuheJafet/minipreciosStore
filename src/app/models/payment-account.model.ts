export interface PaymentAccount {
  id?: number;
  alias: string;
  bank: string;
  accountName: string;
  clabe: string;
  accountNumber?: string;
  instructions?: string;
  isDefault: boolean;
  isActive: boolean;
}
