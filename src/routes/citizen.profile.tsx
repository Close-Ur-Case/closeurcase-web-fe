import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { ProfileForm, type ProfileFormFields } from "@/components/app/ProfileForm";
import { getCitizens, updateCitizenProfile, subscribeToStore } from "@/data/appStore";
import { getCitizenSession, setCitizenSession } from "@/features/citizen/session";

export const Route = createFileRoute("/citizen/profile")({
  component: CitizenProfilePage,
});

function CitizenProfilePage() {
  const [citizens, setCitizens] = useState(getCitizens);

  useEffect(() => {
    const sync = () => setCitizens(getCitizens());
    return subscribeToStore(sync);
  }, []);

  const session = getCitizenSession();
  const citizen = citizens[0];

  if (!citizen) return null;

  const currentName = session.fullName || citizen.name;

  function handleSave(fields: ProfileFormFields) {
    updateCitizenProfile(citizen.id, fields);
    setCitizenSession({ fullName: fields.name });
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
