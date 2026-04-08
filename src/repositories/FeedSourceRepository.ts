import { FeedSource } from "@data";

export interface FeedSourceRepository {
  save(source: FeedSource): Promise<void>;
  findAll(): Promise<FeedSource[]>;
  findById(sourceId: string): Promise<FeedSource | undefined>;
  remove(sourceId: string): Promise<boolean>;
  count(): Promise<number>;
}
