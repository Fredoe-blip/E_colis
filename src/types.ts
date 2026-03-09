export type UserRole = 'merchant' | 'courier' | 'admin';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  name: string;
}

export interface Delivery {
  id: number;
  merchant_id: number;
  courier_id: number | null;
  status: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'returned';
  pickup_address: string;
  delivery_address: string;
  weight: number;
  price: number;
  eta: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourierStats {
  courier_id: number;
  points: number;
  deliveries_completed: number;
  rating: number;
  level: number;
  badges: Badge[];
}

export interface Badge {
  id: number;
  courier_id: number;
  badge_type: string;
  awarded_at: string;
}

export interface LeaderboardEntry {
  name: string;
  points: number;
  deliveries_completed: number;
  level: number;
}
