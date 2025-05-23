import type { ReplyType } from "../models/reply-type";
import { Database } from "../../infra/database";
import { STORES } from "../../infra/database";
import type { RequestLogItem } from "../models/request-log-item";

export class RequestLogRepository {
  constructor(private db: Database) {}

  async save(item: RequestLogItem): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.put(STORES.REQUEST_LOG, item);
  }

  async delete(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.delete(STORES.REQUEST_LOG, id);
  }

  async getLastLogs(limit: number, cursor?: Date): Promise<{ items: RequestLogItem[]; nextCursor?: Date }> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.REQUEST_LOG, "readonly");
      const store = transaction.objectStore(STORES.REQUEST_LOG);
      const index = store.index("by_createdAt");
      
      // Create a range based on cursor
      const range = cursor ? IDBKeyRange.upperBound(cursor, true) : null;
      const request = index.openCursor(range, "prev");
      
      const items: RequestLogItem[] = [];
      let hasMore = false;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && items.length < limit) {
          items.push(cursor.value);
          cursor.continue();
        } else {
          // If we got exactly 'limit' items, there might be more
          hasMore = cursor !== null;
          const lastItem = items.length > 0 ? items[items.length - 1] : undefined;
          resolve({
            items,
            nextCursor: hasMore && lastItem ? lastItem.createdAt : undefined
          });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getByProfileId(profileId: string, limit: number, cursor?: Date): Promise<{ items: RequestLogItem[]; nextCursor?: Date }> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.REQUEST_LOG, "readonly");
      const store = transaction.objectStore(STORES.REQUEST_LOG);
      const index = store.index("by_createdAt");
      
      const range = cursor ? IDBKeyRange.upperBound(cursor, true) : null;
      const request = index.openCursor(range, "prev");
      
      const items: RequestLogItem[] = [];
      let hasMore = false;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const item = cursor.value as RequestLogItem;
          if (item.profileId === profileId) {
            if (items.length < limit) {
              items.push(item);
              cursor.continue();
            } else {
              hasMore = true;
              const lastItem = items[items.length - 1];
              resolve({
                items,
                nextCursor: lastItem?.createdAt
              });
            }
          } else {
            cursor.continue();
          }
        } else {
          const lastItem = items.length > 0 ? items[items.length - 1] : undefined;
          resolve({
            items,
            nextCursor: hasMore && lastItem ? lastItem.createdAt : undefined
          });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}