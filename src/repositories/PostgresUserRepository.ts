import { Pool } from "pg";
import { User } from "@types";
import { UserRepository } from "./UserRepository";

export class PostgresUserRepository implements UserRepository {
  constructor(private pool: Pool) {}

  async save(user: User): Promise<void> {
    if (!user.email.trim()) throw new Error("email must not be empty");
    if (!user.passwordHash.trim()) throw new Error("passwordHash must not be empty");
    await this.pool.query(
      `INSERT INTO users (id, email, password_hash, is_admin, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [user.id, user.email, user.passwordHash, user.isAdmin, user.createdAt]
    );
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const { rows } = await this.pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );
    return rows.length > 0 ? this.toUser(rows[0]) : undefined;
  }

  async findById(id: string): Promise<User | undefined> {
    const { rows } = await this.pool.query(
      "SELECT * FROM users WHERE id = $1",
      [id]
    );
    return rows.length > 0 ? this.toUser(rows[0]) : undefined;
  }

  async findAdmins(): Promise<User[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM users WHERE is_admin = true ORDER BY email ASC"
    );
    return rows.map((row) => this.toUser(row));
  }

  async setAdmin(id: string, isAdmin: boolean): Promise<User | undefined> {
    const { rows } = await this.pool.query(
      "UPDATE users SET is_admin = $2 WHERE id = $1 RETURNING *",
      [id, isAdmin]
    );
    return rows.length > 0 ? this.toUser(rows[0]) : undefined;
  }

  async count(): Promise<number> {
    const { rows } = await this.pool.query(
      "SELECT COUNT(*)::int AS count FROM users"
    );
    return rows[0].count;
  }

  private toUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      isAdmin: row.is_admin ?? false,
      createdAt: Number(row.created_at),
    };
  }
}
