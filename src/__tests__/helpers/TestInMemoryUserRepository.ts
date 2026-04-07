import { User } from "../../types";
import { UserRepository } from "../../repositories/UserRepository";

export class TestInMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<void> {
    if (!user.email.trim()) throw new Error("email must not be empty");
    if (!user.passwordHash.trim()) throw new Error("passwordHash must not be empty");
    if (!this.users.has(user.id)) {
      this.users.set(user.id, user);
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const lower = email.toLowerCase();
    return Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === lower
    );
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async count(): Promise<number> {
    return this.users.size;
  }
}
