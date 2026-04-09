import { Pool } from "pg";
import { Notification } from "@types";
import { NotificationRepository } from "./NotificationRepository";
import { NotificationRow } from "./dbRowTypes";

export class PostgresNotificationRepository implements NotificationRepository {
  constructor(private pool: Pool) {}

  async save(notification: Notification): Promise<void> {
    await this.pool.query(
      `INSERT INTO notifications (id, user_id, type, reference_id, message, is_read, acknowledged_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET message = EXCLUDED.message, is_read = EXCLUDED.is_read`,
      [notification.id, notification.userId, notification.type, notification.referenceId,
       notification.message, notification.isRead, JSON.stringify(notification.acknowledgedBy), notification.createdAt]
    );
  }

  async saveBatch(notifications: Notification[]): Promise<void> {
    for (const n of notifications) {
      await this.save(n);
    }
  }

  async findByUser(userId: string, limit = 20): Promise<Notification[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
      [userId, limit]
    );
    return rows.map((row) => this.toNotification(row));
  }

  async countUnread(userId: string): Promise<number> {
    const { rows } = await this.pool.query(
      "SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = false",
      [userId]
    );
    return rows[0].count;
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    return (rowCount ?? 0) > 0;
  }

  async acknowledge(id: string, adminUserId: string): Promise<Notification | undefined> {
    const { rows } = await this.pool.query(
      `UPDATE notifications
       SET acknowledged_by = acknowledged_by || $1::jsonb
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify([adminUserId]), id]
    );
    return rows.length > 0 ? this.toNotification(rows[0]) : undefined;
  }

  async findById(id: string): Promise<Notification | undefined> {
    const { rows } = await this.pool.query(
      "SELECT * FROM notifications WHERE id = $1",
      [id]
    );
    return rows.length > 0 ? this.toNotification(rows[0]) : undefined;
  }

  async findByTypeAndReference(userId: string, type: string, referenceId: string): Promise<Notification | undefined> {
    const { rows } = await this.pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 AND type = $2 AND reference_id = $3 AND is_read = false ORDER BY created_at DESC LIMIT 1",
      [userId, type, referenceId]
    );
    return rows.length > 0 ? this.toNotification(rows[0]) : undefined;
  }

  private toNotification(row: NotificationRow): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      referenceId: row.reference_id,
      message: row.message,
      isRead: row.is_read,
      acknowledgedBy: row.acknowledged_by ?? [],
      createdAt: Number(row.created_at),
    };
  }
}
