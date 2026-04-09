import { Notification } from "@types";

export interface NotificationRepository {
  save(notification: Notification): Promise<void>;
  saveBatch(notifications: Notification[]): Promise<void>;
  findByUser(userId: string, limit?: number): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  markAsRead(id: string, userId: string): Promise<boolean>;
  acknowledge(id: string, adminUserId: string): Promise<Notification | undefined>;
  findById(id: string): Promise<Notification | undefined>;
  findByTypeAndReference(userId: string, type: string, referenceId: string): Promise<Notification | undefined>;
}
