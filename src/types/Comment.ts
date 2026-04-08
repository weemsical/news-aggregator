export interface Comment {
  id: string;
  highlightId: string;
  userId: string;
  text: string;
  replyToId: string | null;
  createdAt: number;
}
