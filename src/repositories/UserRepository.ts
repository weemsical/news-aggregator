import { User } from "@types";

export interface UserRepository {
  save(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | undefined>;
  findById(id: string): Promise<User | undefined>;
  findAll(): Promise<User[]>;
  findAdmins(): Promise<User[]>;
  setAdmin(id: string, isAdmin: boolean): Promise<User | undefined>;
  count(): Promise<number>;
}
