export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  playTime: number;
  stock?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  address: string;
  city: string;
  zipCode: string;
  phone: string;
  totalAmount: number;
  status: 'Złożone' | 'W realizacji' | 'Zrealizowane';
  createdAt: string;
  items: OrderItem[];
}

export interface User {
  username: string;
  role: 'Owner' | 'Client';
  token?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string; // Keep as optional fallback for backward-compatibility just in case
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
}
