export interface User {
  id: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
  createdAt: number;
}
