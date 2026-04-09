export interface Notification {
  id: string;
  userId: string;
  type: string;
  referenceId: string | null;
  message: string;
  isRead: boolean;
  acknowledgedBy: string[];
  createdAt: number;
}
