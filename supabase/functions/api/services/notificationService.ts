import { db } from "../config/db.ts";
import { appNotifications, fcmTokens } from "../models/notifications.ts";
import { eq, desc, and } from "drizzle-orm";

export class NotificationService {
  static async registerDeviceToken({ userId, role, deviceToken, deviceType = "web" }: any) {
    const id = `fcm_${Date.now()}`;
    const [existing] = await db
      .select()
      .from(fcmTokens)
      .where(and(eq(fcmTokens.userId, userId), eq(fcmTokens.deviceToken, deviceToken)));

    if (existing) {
      await db
        .update(fcmTokens)
        .set({ updatedAt: new Date(), role })
        .where(eq(fcmTokens.id, existing.id));
      return existing;
    }

    const [created] = await db
      .insert(fcmTokens)
      .values({
        id,
        userId,
        role,
        deviceToken,
        deviceType,
      })
      .returning();

    return created;
  }

  static async createInAppNotification({ userId = null, role = "all", title, body }: any) {
    const id = `n_${Date.now()}`;
    const at = new Date().toISOString();

    const [notification] = await db
      .insert(appNotifications)
      .values({
        id,
        userId,
        role,
        title,
        body,
        at,
        read: false,
      })
      .returning();

    return notification;
  }

  static async getNotifications({ role, limit = 50 }: any) {
    let query = db.select().from(appNotifications);
    if (role && role !== "all") {
      query = query.where(eq(appNotifications.role, role)) as any;
    }
    return query.orderBy(desc(appNotifications.createdAt)).limit(limit);
  }

  static async markAsRead(id: string) {
    return db
      .update(appNotifications)
      .set({ read: true })
      .where(eq(appNotifications.id, id))
      .returning();
  }

  static async markAllAsRead(role?: string) {
    let query = db.update(appNotifications).set({ read: true });
    if (role && role !== "all") {
      query = query.where(eq(appNotifications.role, role)) as any;
    }
    return query;
  }
}
