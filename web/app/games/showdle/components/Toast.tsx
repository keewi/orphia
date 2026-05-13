"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

export default function Toast({ message, onDismiss }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setExiting(true), 1800);
    const dismissTimer = setTimeout(onDismiss, 2100); // 1800 + 300ms fade-out
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  return (
    <div className={`sd-toast ${exiting ? "sd-toast--out" : ""}`}>
      {message}
    </div>
  );
}
