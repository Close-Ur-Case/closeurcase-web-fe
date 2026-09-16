import { supabase, supabaseAdmin } from "../config/supabase.ts";
import { db } from "../config/db.ts";
import { users, citizens, lawyers, adminProfiles } from "../models/users.ts";
import { eq } from "drizzle-orm";
import { ApiError } from "../utils/apiError.ts";

export class AuthService {
  static async sendCitizenOtp(phone: string) {
    if (!phone) throw ApiError.badRequest("Phone number is required");

    const { data, error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw ApiError.badRequest(error.message);

    return { message: "OTP sent successfully via SMS", phone, data };
  }

  static async verifyCitizenOtp({ phone, token, name, city }: {
    phone: string;
    token: string;
    name?: string;
    city?: string;
  }) {
    if (!phone || !token) throw ApiError.badRequest("Phone and OTP token are required");

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });

    if (error) throw ApiError.badRequest(error.message);

    const user = data.user!;
    const session = data.session;

    const [existingUser] = await db.select().from(users).where(eq(users.id, user.id));
    if (!existingUser) {
      await db.insert(users).values({
        id: user.id,
        role: "citizen",
        phone: user.phone || phone,
      });
    }

    const [existingCitizen] = await db.select().from(citizens).where(eq(citizens.userId, user.id));
    let citizenRecord;
    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);

    if (existingCitizen) {
      await db
        .update(citizens)
        .set({
          lastLoginAt: nowIso,
          ...(name && { name }),
          ...(city && { city }),
          updatedAt: new Date(),
        })
        .where(eq(citizens.id, existingCitizen.id));

      [citizenRecord] = await db.select().from(citizens).where(eq(citizens.id, existingCitizen.id));
    } else {
      const citizenId = `u_${Date.now()}`;
      [citizenRecord] = await db
        .insert(citizens)
        .values({
          id: citizenId,
          userId: user.id,
          name: name || "Citizen User",
          phone: user.phone || phone,
          city: city || "Hyderabad",
          status: "Active",
          joinedAt: today,
          lastLoginAt: nowIso,
        })
        .returning();
    }

    return {
      user: { id: user.id, role: "citizen", phone: user.phone || phone },
      citizen: citizenRecord,
      session: {
        accessToken: session?.access_token,
        refreshToken: session?.refresh_token,
        expiresIn: session?.expires_in,
      },
    };
  }

  static async registerLawyer(lawyerData: any) {
    const { email, password, confirmPassword, name, phone, category, city, barId, experienceYears, practiceAreas, legalServices } = lawyerData;
    if (!email || !password || !name || !phone || !barId) {
      throw ApiError.badRequest("Email, password, name, phone, and barId are required");
    }
    if (confirmPassword && password !== confirmPassword) {
      throw ApiError.badRequest("Password and confirm password do not match");
    }
    if (password.length < 6) {
      throw ApiError.badRequest("Password must be at least 6 characters long");
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: "lawyer", name } },
    });

    if (authError) throw ApiError.badRequest(authError.message);

    const userId = authData.user?.id;
    if (!userId) throw ApiError.internal("Failed to create user");

    await db.insert(users).values({ id: userId, role: "lawyer", email, phone });

    const lawyerId = `l_${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);

    const [lawyerRecord] = await db
      .insert(lawyers)
      .values({
        id: lawyerId,
        userId,
        name,
        email,
        phone,
        category: category || "Civil",
        city: city || "Hyderabad",
        barId,
        experienceYears: experienceYears || 0,
        status: "Pending",
        rating: "4.8",
        activeCases: 0,
        practiceAreas: practiceAreas || [],
        legalServices: legalServices || [],
        joinedAt: today,
      })
      .returning();

    return {
      message: "Lawyer registration submitted successfully. Pending administrative verification.",
      lawyer: lawyerRecord,
      session: authData.session,
    };
  }

  static async loginLawyer(email: string, password: string) {
    if (!email || !password) throw ApiError.badRequest("Email and password are required");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw ApiError.unauthorized(error.message);

    const user = data.user!;
    const [lawyerRecord] = await db.select().from(lawyers).where(eq(lawyers.userId, user.id));

    return {
      user: { id: user.id, role: "lawyer", email: user.email },
      lawyer: lawyerRecord,
      session: {
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
      },
    };
  }

  static async loginAdmin(email: string, password: string) {
    if (!email || !password) throw ApiError.badRequest("Email and password are required");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw ApiError.unauthorized(error.message);

    const user = data.user!;
    const [adminRecord] = await db.select().from(adminProfiles).where(eq(adminProfiles.userId, user.id));

    return {
      user: { id: user.id, role: "admin", email: user.email },
      admin: adminRecord || { name: "Super Admin", email: user.email, role: "superadmin" },
      session: {
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
      },
    };
  }
}
