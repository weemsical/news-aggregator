import { Notification } from "@types";
import { NotificationRepository } from "@repositories";

export class TestInMemoryNotificationRepository implements NotificationRepository {
  private notifications: Map<string, Notification> = new Map();

  async save(notification: Notification): Promise<void> {
    this.notifications.set(notification.id, notification);
  }

  async saveBatch(notifications: Notification[]): Promise<void> {
    for (const n of notifications) {
      await this.save(n);
    }
  }

  async findByUser(userId: string, limit = 20): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  async countUnread(userId: string): Promise<number> {
    return Array.from(this.notifications.values())
      .filter((n) => n.userId === userId && !n.isRead)
      .length;
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    const n = this.notifications.get(id);
    if (!n || n.userId !== userId) return false;
    this.notifications.set(id, { ...n, isRead: true });
    return true;
  }

  async acknowledge(id: string, adminUserId: string): Promise<Notification | undefined> {
    const n = this.notifications.get(id);
    if (!n) return undefined;
    const updated = { ...n, acknowledgedBy: [...n.acknowledgedBy, adminUserId] };
    this.notifications.set(id, updated);
    return updated;
  }

  async findById(id: string): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async findByTypeAndReference(userId: string, type: string, referenceId: string): Promise<Notification | undefined> {
    return Array.from(this.notifications.values())
      .filter((n) => n.userId === userId && n.type === type && n.referenceId === referenceId && !n.isRead)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
  }
}
