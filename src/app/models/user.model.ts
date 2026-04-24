export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Address {
  id?: number;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface SavedCard {
  id?: number;
  cardName: string;
  last4: string;
  brand: string;
  expiry: string;
  isDefault?: boolean;
}
