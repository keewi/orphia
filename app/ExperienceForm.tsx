"use client";

import { addSeenEntry, writeSaved } from "./MusicalCard";

export default function ExperienceForm({
  musicalId,
  action,
  children,
}: {
  musicalId: string;
  action: (formData: FormData) => void;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={() => {
        // Record the experience and clear saved-for-later
        // before the server action runs and redirects
        addSeenEntry(musicalId);
        writeSaved(musicalId, false);
      }}
    >
      {children}
    </form>
  );
}
