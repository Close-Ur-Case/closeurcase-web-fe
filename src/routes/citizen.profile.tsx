import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { ProfileForm, type ProfileFormFields } from "@/components/app/ProfileForm";
import {
  getCitizens,
  updateCitizenProfile,
  subscribeToStore,
  mergeRemoteCitizens,
  setProfilePhoto,
  getProfilePhoto,
} from "@/data/appStore";
import type { Citizen } from "@/types";
import { getCitizenSession, setCitizenSession } from "@/features/citizen/session";
import { citizenService } from "@/services/citizenService";
import { useAuth } from "@/context/useAuth";

export const Route = createFileRoute("/citizen/profile")({
  component: CitizenProfilePage,
});

function CitizenProfilePage() {
  const { user, setUser } = useAuth();
  const [citizens, setCitizens] = useState<Citizen[]>(getCitizens);
  const [remoteProfile, setRemoteProfile] = useState<Partial<Citizen> | null>(null);

  useEffect(() => {
    let mounted = true;

    const session = getCitizenSession();
    citizenService
      .getMe({
        email: user?.email || session.email || undefined,
        phone: user?.phone || session.phone || undefined,
        id: user?.citizenId || user?.id || undefined,
      })
      .then((me) => {
        if (!mounted || !me) return;
        setRemoteProfile(me as Partial<Citizen>);
        if (me.name) {
          setCitizenSession({ fullName: me.name });
        }
        if (me.avatarUrl) {
          setProfilePhoto("citizen", me.avatarUrl);
        }
        mergeRemoteCitizens([me as Partial<Citizen>]);
      })
      .catch((err: unknown) => {
        console.warn("[Citizen Profile] Server fetch notice:", err);
      });

    const sync = () => setCitizens(getCitizens());
    const unsub = subscribeToStore(sync);
    return () => {
      mounted = false;
      unsub();
    };
  }, [user?.email, user?.phone, user?.id, user?.citizenId]);

  const session = getCitizenSession();

  // Find existing record safely without crashing on null/undefined values
  const citizen = useMemo(() => {
    if (user?.id || user?.phone || user?.email) {
      const found = citizens.find((c) => {
        if (user.id && (c.id === user.id || user.citizenId === c.id)) return true;
        if (user.phone && c.phone && c.phone.includes(user.phone)) return true;
        if (user.email && c.email && c.email.toLowerCase() === user.email.toLowerCase()) {
          return true;
        }
        return false;
      });
      if (found) return found;
    }
    return citizens[0] || null;
  }, [citizens, user]);

  const currentName =
    remoteProfile?.name || user?.name || session.fullName || citizen?.name || "Citizen User";

  const currentEmail = remoteProfile?.email || user?.email || session.email || citizen?.email || "";

  const currentPhone = remoteProfile?.phone || user?.phone || session.phone || citizen?.phone || "";

  const currentCity = remoteProfile?.city || user?.city || citizen?.city || "Hyderabad";

  const currentLocation =
    remoteProfile?.currentLocation || citizen?.currentLocation || `${currentCity}, India`;

  const userAvatar = typeof user?.avatarUrl === "string" ? user.avatarUrl : undefined;
  const currentAvatarUrl: string | undefined =
    remoteProfile?.avatarUrl ||
    citizen?.avatarUrl ||
    getProfilePhoto("citizen") ||
    userAvatar ||
    undefined;

  // Requirement 1: Disable email if signup with email; disable phone if signup with phone
  const isEmailSignup =
    user?.signupMethod === "email" ||
    Boolean(user?.email && !user?.phone) ||
    Boolean(remoteProfile?.email && !remoteProfile?.phone);

  const isPhoneSignup =
    user?.signupMethod === "phone" ||
    Boolean(user?.phone && !user?.email) ||
    Boolean(remoteProfile?.phone && !remoteProfile?.email);

  const disableEmail = isEmailSignup;
  const disablePhone = isPhoneSignup && !isEmailSignup;

  function handleSave(fields: ProfileFormFields) {
    const targetId = citizen?.id || user?.citizenId || user?.id;
    if (targetId) {
      updateCitizenProfile(targetId, fields);
    }
    if (fields.avatarUrl) {
      setProfilePhoto("citizen", fields.avatarUrl);
    }
    setCitizenSession({ fullName: fields.name, phone: fields.phone, email: fields.email });

    if (user) {
      setUser({
        ...user,
        name: fields.name,
        phone: fields.phone,
        email: fields.email,
        city: fields.city,
        avatarUrl: fields.avatarUrl,
      });
    }

    setRemoteProfile((prev) => ({
      ...prev,
      name: fields.name,
      phone: fields.phone,
      email: fields.email,
      city: fields.city,
      currentLocation: fields.currentLocation,
      avatarUrl: fields.avatarUrl,
    }));

    // Save profile changes (including currentLocation and avatarUrl) to backend
    citizenService
      .updateMe({
        fullName: fields.name,
        name: fields.name,
        city: fields.city,
        currentLocation: fields.currentLocation,
        avatarUrl: fields.avatarUrl,
        phone: fields.phone?.trim() ? fields.phone.trim() : undefined,
        email: fields.email?.trim() ? fields.email.trim() : undefined,
      })
      .then((updated) => {
        if (updated?.avatarUrl) {
          setRemoteProfile((prev) => ({ ...prev, avatarUrl: updated.avatarUrl || undefined }));
          setProfilePhoto("citizen", updated.avatarUrl);
        }
      })
      .catch((err: unknown) => {
        console.warn("[Citizen Profile] Server update notice:", err);
      });
  }

  // Key the form by current user/profile to cleanly re-populate when server fetch finishes
  const formKey = remoteProfile?.id
    ? `server-${remoteProfile.id}`
    : `user-${user?.citizenId || user?.id || "local"}`;

  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your personal information."
        actionsPosition="below"
      />
      <ProfileForm
        key={formKey}
        role="citizen"
        disableEmail={disableEmail}
        disablePhone={disablePhone}
        defaults={{
          name: currentName,
          email: currentEmail,
          phone: currentPhone,
          city: currentCity,
          currentLocation: currentLocation,
          avatarUrl: currentAvatarUrl,
          aadhar: "",
        }}
        defaultPhotoUrl={currentAvatarUrl}
        wide
        onSave={handleSave}
      />
    </>
  );
}
