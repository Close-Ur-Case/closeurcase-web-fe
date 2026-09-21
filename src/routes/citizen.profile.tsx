import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { ProfileForm, type ProfileFormFields } from "@/components/app/ProfileForm";
import { getCitizens, updateCitizenProfile, subscribeToStore } from "@/data/appStore";
import { getCitizenSession, setCitizenSession } from "@/features/citizen/session";
import { citizenService } from "@/services/citizenService";
import { useAuth } from "@/context/useAuth";

export const Route = createFileRoute("/citizen/profile")({
  component: CitizenProfilePage,
});

function CitizenProfilePage() {
  const { user } = useAuth();
  const [citizens, setCitizens] = useState(getCitizens);

  useEffect(() => {
    const sync = () => setCitizens(getCitizens());
    citizenService
      .getMe()
      .then((me) => {
        if (me && me.name) {
          setCitizenSession({ fullName: me.name });
        }
      })
      .catch((err: unknown) => {
        console.warn("[Citizen Profile] Server fetch notice:", err);
      });
    return subscribeToStore(sync);
  }, []);

  const session = getCitizenSession();
  const citizen = useMemo(() => {
    if (user?.id || user?.phone) {
      const found = citizens.find(
        (c) => c.id === user.id || (user.phone && c.phone.includes(user.phone)),
      );
      if (found) return found;
    }
    return citizens[0];
  }, [citizens, user]);

  if (!citizen) return null;

  const currentName = session.fullName || citizen.name;

  function handleSave(fields: ProfileFormFields) {
    updateCitizenProfile(citizen.id, fields);
    setCitizenSession({ fullName: fields.name });

    citizenService
      .updateMe({
        fullName: fields.name,
        city: fields.city,
      })
      .catch((err: unknown) => {
        console.warn("[Citizen Profile] Server update notice:", err);
      });
  }

  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your personal information."
        actionsPosition="below"
      />
      <ProfileForm
        role="citizen"
        defaults={{
          name: currentName,
          email: citizen.email,
          phone: citizen.phone,
          city: citizen.city,
          currentLocation: citizen.currentLocation || "Visakhapatnam, Andhra Pradesh",
          aadhar: "",
        }}
        wide
        onSave={handleSave}
      />
    </>
  );
}
