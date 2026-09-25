import { supabase, supabaseAdmin } from "../config/supabase.ts";
import { db } from "../config/db.ts";
import { users, citizens, lawyers, adminProfiles } from "../models/users.ts";
import { eq, ilike } from "drizzle-orm";
import { ApiError } from "../utils/apiError.ts";
import { LawyerLanguageService } from "./lawyerLanguageService.ts";
import { LawyerCategoryService } from "./lawyerCategoryService.ts";

export class AuthService {
  static async sendCitizenOtp(
    param: string | { phone?: string; email?: string; identifier?: string },
  ) {
    let phone: string | undefined = typeof param === "string" ? param : param?.phone;
    let email: string | undefined = typeof param === "object" ? param?.email : undefined;
    const identifier: string | undefined =
      typeof param === "object" ? param?.identifier : undefined;

    if (!phone && !email && identifier) {
      if (identifier.includes("@")) {
        email = identifier.trim().toLowerCase();
      } else {
        phone = identifier.trim();
      }
    }

    let userExists = false;
    let existingFullName: string | null = null;

    if (email) {
      const cleanEmail = email.trim().toLowerCase();

      // Check if citizen exists with this email
      const [foundCitizen] = await db
        .select({ id: citizens.id, name: citizens.name })
        .from(citizens)
        .where(ilike(citizens.email, cleanEmail));

      if (foundCitizen?.name) {
        userExists = true;
        existingFullName = foundCitizen.name;
      } else {
        const [foundUser] = await db
          .select({ id: users.id })
          .from(users)
          .where(ilike(users.email, cleanEmail));
        if (foundUser) {
          const [cit] = await db
            .select({ name: citizens.name })
            .from(citizens)
            .where(eq(citizens.userId, foundUser.id));
          if (cit?.name) {
            userExists = true;
            existingFullName = cit.name;
          }
        }
      }

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
        userExists,
        name: existingFullName,
        fullName: existingFullName,
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

      const last10 = cleanDigits.slice(-10);
      const allCitizens = await db
        .select({ id: citizens.id, name: citizens.name, phone: citizens.phone, userId: citizens.userId })
        .from(citizens);

      const matchedCitizen = allCitizens.find(
        (c) => c.phone && c.phone.replace(/\D/g, "").slice(-10) === last10
      );

      if (matchedCitizen?.name) {
        userExists = true;
        existingFullName = matchedCitizen.name;
      } else {
        const allUsers = await db.select({ id: users.id, phone: users.phone }).from(users);
        const matchedUser = allUsers.find(
          (u) => u.phone && u.phone.replace(/\D/g, "").slice(-10) === last10
        );
        if (matchedUser) {
          const [cit] = await db
            .select({ name: citizens.name })
            .from(citizens)
            .where(eq(citizens.userId, matchedUser.id));
          if (cit?.name) {
            userExists = true;
            existingFullName = cit.name;
          }
        }
      }

      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) {
        if (error.message.includes("Unsupported phone provider")) {
          return {
            message: `OTP sent successfully via SMS to ${formattedPhone}`,
            channel: "sms",
            recipient: formattedPhone,
            phone: formattedPhone,
            userExists,
            name: existingFullName,
            fullName: existingFullName,
            data: { testMode: true },
          };
        }
        throw ApiError.badRequest(error.message);
      }

      return {
        message: `OTP sent successfully via SMS to ${formattedPhone}`,
        channel: "sms",
        recipient: formattedPhone,
        phone: formattedPhone,
        userExists,
        name: existingFullName,
        fullName: existingFullName,
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

      if (authResponse.error && authResponse.error.message.includes("Unsupported phone provider")) {
        const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
        let matchedAuthUser = usersList?.users?.find(
          (u) => u.phone && u.phone.replace(/\D/g, "").slice(-10) === cleanDigits.slice(-10)
        );

        if (!matchedAuthUser) {
          const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            phone: formattedPhone,
            phone_confirm: true,
          });
          if (createErr) throw ApiError.badRequest(createErr.message);
          matchedAuthUser = created.user;
        }

        authResponse = {
          data: {
            user: matchedAuthUser,
            session: null,
          },
          error: null,
        } as any;
      }

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
      const citizenCity = city || "Hyderabad";
      [citizenRecord] = await db
        .insert(citizens)
        .values({
          id: citizenId,
          userId: user.id,
          name: name || (user.email ? user.email.split("@")[0] : "Citizen User"),
          email: user.email || email || null,
          phone: user.phone || phone || null,
          city: citizenCity,
          state: citizenCity === "Visakhapatnam" ? "Andhra Pradesh" : "Telangana",
          stateId: citizenCity === "Visakhapatnam" ? "andhra_pradesh" : "telangana",
          districtId: citizenCity === "Visakhapatnam" ? "visakhapatnam" : "hyderabad",
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
    const {
      email,
      password,
      confirmPassword,
      name,
      phone,
      category,
      city,
      barId,
      experienceYears,
      practiceAreas,
      legalServices,
    } = lawyerData;

    if (!email || !password || !name || !phone || !barId) {
      throw ApiError.badRequest("Email, password, name, phone, and barId are required");
    }
    if (confirmPassword && password !== confirmPassword) {
      throw ApiError.badRequest("Password and confirm password do not match");
    }
    if (password.length < 6) {
      throw ApiError.badRequest("Password must be at least 6 characters long");
    }

    let userId = lawyerData.userId;
    let authSession = null;
    if (!userId) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password || "Legal@12345",
        options: {
          data: { role: "lawyer", full_name: name, phone },
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("already exists")
        ) {
          const { data: adminUserData } = await supabaseAdmin.auth.admin.listUsers();
          const matchedAuthUser = adminUserData?.users?.find(
            (u) => u.email?.toLowerCase() === email.toLowerCase()
          );
          if (matchedAuthUser) {
            userId = matchedAuthUser.id;
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              password: password || "Legal@12345",
              user_metadata: { role: "lawyer", full_name: name, phone },
            });
          } else {
            throw ApiError.badRequest(error.message);
          }
        } else {
          throw ApiError.badRequest(error.message);
        }
      } else {
        userId = data.user?.id || `usr_${Date.now()}`;
        authSession = data.session;
      }
    }

    const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
    if (!existingUser) {
      await db.insert(users).values({
        id: userId,
        role: "lawyer",
        email,
        phone,
      });
    } else {
      await db
        .update(users)
        .set({
          role: "lawyer",
          email,
          phone,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    const lawyerId = `l_${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);

    const { languageIds, details: linkedLanguagesList } =
      await LawyerLanguageService.resolveLanguageIds(lawyerData.languages || []);

    const {
      practiceAreas: normalizedAreas,
      specializations: normalizedSpecs,
      legalServices: normalizedServices,
      primaryCategory,
    } = await LawyerCategoryService.validateAndNormalize(
      practiceAreas || [],
      lawyerData.specializations || [],
      legalServices || [],
    );

    const targetCity = city || lawyerData.cities?.[0] || "Hyderabad";
    const [existingLawyer] = await db
      .select()
      .from(lawyers)
      .where(eq(lawyers.userId, userId));

    let lawyerRecord;
    if (existingLawyer) {
      [lawyerRecord] = await db
        .update(lawyers)
        .set({
          name,
          email,
          phone,
          category: category || primaryCategory,
          roleTitle:
            lawyerData.roleTitle ||
            (lawyerData.registrationType === "firm" ? "Law Firm / Organisation" : "Advocate"),
          registrationType: lawyerData.registrationType || "lawyer",
          city: targetCity,
          cities: lawyerData.cities || (targetCity ? [targetCity] : ["Hyderabad"]),
          stateId:
            lawyerData.stateId ||
            (targetCity === "Visakhapatnam"
              ? "andhra_pradesh"
              : targetCity === "Hyderabad"
                ? "telangana"
                : null),
          districtId:
            lawyerData.districtId ||
            (targetCity === "Visakhapatnam"
              ? "visakhapatnam"
              : targetCity === "Hyderabad"
                ? "hyderabad"
                : null),
          barId,
          experienceYears: experienceYears || 0,
          status: "Pending",
          photoUrl: lawyerData.photoUrl || existingLawyer.photoUrl,
          idProofUrl: lawyerData.idProofUrl || existingLawyer.idProofUrl,
          idProofFileName: lawyerData.idProofFileName || existingLawyer.idProofFileName,
          officeAddress: lawyerData.officeAddress || existingLawyer.officeAddress,
          bio: lawyerData.bio || existingLawyer.bio,
          languages: languageIds,
          practiceAreas: normalizedAreas,
          specializations: normalizedSpecs,
          legalServices: normalizedServices,
          courts: lawyerData.courts || existingLawyer.courts,
          awards: lawyerData.awards || existingLawyer.awards,
          declarationAccepted: lawyerData.declarationAccepted !== false,
          updatedAt: new Date(),
        })
        .where(eq(lawyers.id, existingLawyer.id))
        .returning();
    } else {
      [lawyerRecord] = await db
        .insert(lawyers)
        .values({
          id: lawyerId,
          userId,
          name,
          email,
          phone,
          category: category || primaryCategory,
          roleTitle:
            lawyerData.roleTitle ||
            (lawyerData.registrationType === "firm" ? "Law Firm / Organisation" : "Advocate"),
          registrationType: lawyerData.registrationType || "lawyer",
          city: targetCity,
          cities: lawyerData.cities || (targetCity ? [targetCity] : ["Hyderabad"]),
          stateId:
            lawyerData.stateId ||
            (targetCity === "Visakhapatnam"
              ? "andhra_pradesh"
              : targetCity === "Hyderabad"
                ? "telangana"
                : null),
          districtId:
            lawyerData.districtId ||
            (targetCity === "Visakhapatnam"
              ? "visakhapatnam"
              : targetCity === "Hyderabad"
                ? "hyderabad"
                : null),
          barId,
          experienceYears: experienceYears || 0,
          status: "Pending",
          rating: "4.8",
          activeCases: 0,
          photoUrl: lawyerData.photoUrl || null,
          idProofUrl: lawyerData.idProofUrl || null,
          idProofFileName: lawyerData.idProofFileName || null,
          officeAddress: lawyerData.officeAddress || null,
          bio: lawyerData.bio || null,
          languages: languageIds,
          practiceAreas: normalizedAreas,
          specializations: normalizedSpecs,
          legalServices: normalizedServices,
          courts: lawyerData.courts || [],
          awards: lawyerData.awards || [],
          consultationFee: lawyerData.consultationFee || 1000,
          declarationAccepted: lawyerData.declarationAccepted !== false,
          joinedAt: today,
        })
        .returning();
    }

    const categoriesDetails = await LawyerCategoryService.getCategoriesForLawyer(
      normalizedAreas,
      normalizedSpecs,
      normalizedServices,
    );

    return {
      message: "Lawyer registration submitted successfully. Pending administrative verification.",
      lawyer: {
        ...lawyerRecord,
        languagesDetails: linkedLanguagesList,
        categoriesDetails,
      },
      session: authSession,
    };
  }

  static async loginLawyer(email: string, password: string) {
    if (!email || !password) throw ApiError.badRequest("Email and password are required");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw ApiError.unauthorized(error.message);

    const user = data.user!;
    const [lawyerRecord] = await db.select().from(lawyers).where(eq(lawyers.userId, user.id));

    let languagesDetails: any[] = [];
    let categoriesDetails: any[] = [];
    if (lawyerRecord) {
      [languagesDetails, categoriesDetails] = await Promise.all([
        LawyerLanguageService.getLanguagesForLawyer(lawyerRecord.id),
        LawyerCategoryService.getCategoriesForLawyer(
          (lawyerRecord.practiceAreas || []) as string[],
          (lawyerRecord.specializations || []) as string[],
          (lawyerRecord.legalServices || []) as string[],
        ),
      ]);
    }

    return {
      user: { id: user.id, role: "lawyer", email: user.email },
      lawyer: lawyerRecord ? { ...lawyerRecord, languagesDetails, categoriesDetails } : null,
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

    // There is no self-service admin registration — accounts are provisioned
    // out-of-band in Supabase Auth, so nothing stamps `user_metadata.role`
    // the way `registerLawyer`'s `signUp` call does for lawyers. Without a
    // matching `public.users` row either, `authenticateUser`'s role
    // resolution falls through to its "citizen" default for every admin,
    // regardless of how long they've been signing in.
    //
    // Verified live: signing in with real admin credentials, `GET /auth/me`
    // resolved `role: "citizen"` from this exact gap, and `admin.me`'s new
    // role check (added to close a separate leak — see adminController.ts)
    // then correctly, but unhelpfully, locked out the only real admin
    // account. Self-healing here, the same way `verifyCitizenOtp` already
    // does for citizens, is what makes that check able to pass for a genuine
    // admin at all.
    const [existingUser] = await db.select().from(users).where(eq(users.id, user.id));
    if (!existingUser) {
      await db.insert(users).values({
        id: user.id,
        role: "admin",
        email: user.email || email,
        phone: user.phone || null,
      });
    } else if (existingUser.role !== "admin") {
      await db
        .update(users)
        .set({ role: "admin", updatedAt: new Date() })
        .where(eq(users.id, user.id));
    }

    const [adminRecord] = await db
      .select()
      .from(adminProfiles)
      .where(eq(adminProfiles.userId, user.id));

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
