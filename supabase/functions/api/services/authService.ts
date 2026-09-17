import { supabase, supabaseAdmin } from "../config/supabase.ts";
import { db } from "../config/db.ts";
import { users, citizens, lawyers, adminProfiles } from "../models/users.ts";
import { eq } from "drizzle-orm";
import { ApiError } from "../utils/apiError.ts";

export class AuthService {
  static async sendCitizenOtp(
    param: string | { phone?: string; email?: string; identifier?: string }
  ) {
    let phone: string | undefined = typeof param === "string" ? param : param?.phone;
    let email: string | undefined = typeof param === "object" ? param?.email : undefined;
    const identifier: string | undefined = typeof param === "object" ? param?.identifier : undefined;

    if (!phone && !email && identifier) {
      if (identifier.includes("@")) {
        email = identifier.trim().toLowerCase();
      } else {
        phone = identifier.trim();
      }
    }

    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) throw ApiError.badRequest(error.message);

      return {
        message: `OTP sent successfully to email: ${cleanEmail}`,
        channel: "email",
        recipient: cleanEmail,
        email: cleanEmail,
        data,
      };
    }

    if (phone) {
      const cleanDigits = phone.replace(/\D/g, "");
      if (!cleanDigits) throw ApiError.badRequest("Valid phone number is required");
      const formattedPhone = phone.startsWith("+")
        ? phone
        : cleanDigits.length === 10
        ? `+91${cleanDigits}`
        : `+${cleanDigits}`;

      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) throw ApiError.badRequest(error.message);

      return {
        message: `OTP sent successfully via SMS to ${formattedPhone}`,
        channel: "sms",
        recipient: formattedPhone,
        phone: formattedPhone,
        data,
      };
    }

    throw ApiError.badRequest("Mobile number or Email address is required");
  }

  static async verifyCitizenOtp(params: {
    phone?: string;
    email?: string;
    identifier?: string;
    token: string;
    name?: string;
    city?: string;
  }) {
    let { phone, email, identifier, token, name, city } = params;
    if (!token) throw ApiError.badRequest("OTP token is required");

    if (!phone && !email && identifier) {
      if (identifier.includes("@")) {
        email = identifier.trim().toLowerCase();
      } else {
        phone = identifier.trim();
      }
    }

    let authResponse;
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      authResponse = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: token.trim(),
        type: "email",
      });

      // If type: "email" failed, fallback to "magiclink" or "signup" OTP types
      if (authResponse.error) {
        const magicLinkRetry = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: token.trim(),
          type: "magiclink",
        });
        if (!magicLinkRetry.error) {
          authResponse = magicLinkRetry;
        } else {
          const signupRetry = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: token.trim(),
            type: "signup",
          });
          if (!signupRetry.error) authResponse = signupRetry;
        }
      }
      email = cleanEmail;
    } else if (phone) {
      const cleanDigits = phone.replace(/\D/g, "");
      const formattedPhone = phone.startsWith("+")
        ? phone
        : cleanDigits.length === 10
        ? `+91${cleanDigits}`
        : `+${cleanDigits}`;
      authResponse = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: token.trim(),
        type: "sms",
      });
      phone = formattedPhone;
    } else {
      throw ApiError.badRequest("Either mobile number or email address is required");
    }

    if (authResponse.error) throw ApiError.badRequest(authResponse.error.message);

    const user = authResponse.data.user!;
    const session = authResponse.data.session;

    const [existingUser] = await db.select().from(users).where(eq(users.id, user.id));
    if (!existingUser) {
      await db.insert(users).values({
        id: user.id,
        role: "citizen",
        email: user.email || email || null,
        phone: user.phone || phone || null,
      });
    } else {
      await db
        .update(users)
        .set({
          email: user.email || email || existingUser.email,
          phone: user.phone || phone || existingUser.phone,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
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
          ...(user.email || email ? { email: user.email || email } : {}),
          ...(user.phone || phone ? { phone: user.phone || phone } : {}),
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
          name: name || (user.email ? user.email.split("@")[0] : "Citizen User"),
          email: user.email || email || null,
          phone: user.phone || phone || null,
          city: city || "Hyderabad",
          status: "Active",
          joinedAt: today,
          lastLoginAt: nowIso,
        })
        .returning();
    }

    return {
      user: {
        id: user.id,
        role: "citizen",
        email: user.email || email || null,
        phone: user.phone || phone || null,
      },
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
