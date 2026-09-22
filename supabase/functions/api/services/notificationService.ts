import { db } from "../config/db.ts";
import { appNotifications, fcmTokens } from "../models/notifications.ts";
import { eq, desc, and } from "drizzle-orm";
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
      await this.pushToTargets({ userId, role, title, body });
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
   * configured — `firebaseAdmin.isConfigured()` mirrors the same
   * "gracefully do nothing without real credentials" pattern Razorpay/Agora
   * already use elsewhere in this backend.
   *
   * A token FCM reports as dead (unregistered/invalid) is removed rather
   * than retried on the next notification — it can only ever fail the same
   * way again.
   */
  static async pushToTargets({
    userId,
    role,
    title,
    body,
  }: {
    userId?: string | null;
    role?: string | null;
    title: string;
    body: string;
  }) {
    if (!firebaseAdmin.isConfigured()) return;

    const targets = userId
      ? await db.select().from(fcmTokens).where(eq(fcmTokens.userId, userId))
      : role && role !== "all"
        ? await db.select().from(fcmTokens).where(eq(fcmTokens.role, role))
        : await db.select().from(fcmTokens);

    await Promise.all(
      targets.map(async (t) => {
        const result = await firebaseAdmin.sendToDevice(t.deviceToken, { title, body });
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
