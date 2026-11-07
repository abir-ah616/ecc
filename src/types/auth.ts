export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'disabled';

export interface AllowedUserRecord {
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  notes?: string;
  addedBy?: string;
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
  photoURL?: string;
  uid?: string;
}
