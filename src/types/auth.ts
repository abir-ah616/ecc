export type UserRole = 'admin' | 'user' | 'temp';
export type UserStatus = 'active' | 'disabled';

export interface AllowedUserRecord {
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  allowAiAuto?: boolean;
  aiApiKeys?: string[];
  notes?: string;
  addedBy?: string;
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
  photoURL?: string;
  uid?: string;
}

export interface AuthAppSettings {
  allowTempLogin: boolean;
  updatedAt: number;
  updatedBy?: string;
}
