import { db } from "../config/db.ts";
import { appNotifications, fcmTokens } from "../models/notifications.ts";
import { citizens, lawyers } from "../models/users.ts";
import { eq, desc, and, or, inArray } from "drizzle-orm";
import { firebaseAdmin } from "../config/firebaseAdmin.ts";

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

  static async unregisterDeviceToken({ userId, deviceToken }: any) {
    if (!deviceToken) return null;
    const conditions = [eq(fcmTokens.deviceToken, deviceToken)];
    if (userId) {
      conditions.push(eq(fcmTokens.userId, userId));
    }
    await db.delete(fcmTokens).where(and(...conditions));
    return { success: true };
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

    // Best-effort: this must never fail (or slow down) creating the in-app
    // row, which every caller actually depends on. Awaited rather than
    // fire-and-forget, though — an edge function's isolate can be torn down
    // right after it responds, and an un-awaited background task has no
    // guarantee it finishes before that happens.
    try {
      const url =
        role === "lawyer"
          ? "/lawyer/notifications"
          : role === "citizen"
            ? "/citizen/notifications"
            : "/admin/notifications";
      await this.pushToTargets({
        userId,
        role,
        title,
        body,
        data: {
          notificationId: id,
          type: "app_notification",
          url,
        },
      });
    } catch (err) {
      console.error("[NotificationService] Push fan-out failed:", err);
    }

    return notification;
  }

  /**
   * Fans a push out to every device token matching the same targeting the
   * in-app notification used: one person's tokens for a `userId`-targeted
   * notification, every token for that role for a role broadcast, or every
   * token at all for `role: "all"`. No-ops immediately if Firebase isn't
   * configured.
   */
  static async pushToTargets({
    userId,
    role,
    title,
    body,
    data,
  }: {
    userId?: string | null;
    role?: string | null;
    title: string;
    body: string;
    data?: Record<string, string>;
  }) {
    if (!firebaseAdmin.isConfigured()) return;

    const targetUserIds = new Set<string>();
    if (userId) {
      targetUserIds.add(userId);
      try {
        const [cit] = await db
          .select({ id: citizens.id, userId: citizens.userId })
          .from(citizens)
          .where(or(eq(citizens.id, userId), eq(citizens.userId, userId)));
        if (cit) {
          if (cit.id) targetUserIds.add(cit.id);
          if (cit.userId) targetUserIds.add(cit.userId);
        }
        const [law] = await db
          .select({ id: lawyers.id, userId: lawyers.userId })
          .from(lawyers)
          .where(or(eq(lawyers.id, userId), eq(lawyers.userId, userId)));
        if (law) {
          if (law.id) targetUserIds.add(law.id);
          if (law.userId) targetUserIds.add(law.userId);
        }
      } catch (lookupErr) {
        console.warn("[NotificationService] Target ID resolution warning:", lookupErr);
      }
    }

    const ids = Array.from(targetUserIds);
    let targets =
      ids.length > 0
        ? await db.select().from(fcmTokens).where(inArray(fcmTokens.userId, ids))
        : role && role !== "all"
          ? await db.select().from(fcmTokens).where(eq(fcmTokens.role, role))
          : await db.select().from(fcmTokens);

    // Fallback if user ID has no tokens registered directly but role tokens exist
    if (targets.length === 0 && role && role !== "all") {
      targets = await db.select().from(fcmTokens).where(eq(fcmTokens.role, role));
    }

    // Deduplicate by deviceToken so multiple rows don't send duplicate notifications
    const seenTokens = new Set<string>();
    const uniqueTargets = targets.filter((t) => {
      if (seenTokens.has(t.deviceToken)) return false;
      seenTokens.add(t.deviceToken);
      return true;
    });

    await Promise.all(
      uniqueTargets.map(async (t) => {
        const result = await firebaseAdmin.sendToDevice(t.deviceToken, { title, body }, data);
        if (!result.ok) {
          if (result.tokenInvalid) {
            await db.delete(fcmTokens).where(eq(fcmTokens.id, t.id));
          }
          console.warn(
            `[NotificationService] Push to ${t.id} failed${result.tokenInvalid ? " (token removed)" : ""}:`,
            result.error
          );
        }
      })
    );
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
