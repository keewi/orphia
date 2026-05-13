"use client";

export default function ExperienceForm({
  action,
  children,
}: {
  action: (formData: FormData) => void;
  children: React.ReactNode;
}) {
  return <form action={action}>{children}</form>;
}
