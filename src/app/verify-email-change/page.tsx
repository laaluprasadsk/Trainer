"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Notice, request, Shell } from "@/components/ui/marketplace";
import { useAuth } from "@/lib/auth-context";

export default function EmailChangePage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const attempted = useRef(false);
  const { user } = useAuth();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token || attempted.current) {
      if (!token)
        queueMicrotask(() =>
          setError("This email change link is missing or invalid."),
        );
      return;
    }
    attempted.current = true;
    request<{ message: string }>("/api/account/email", "POST", {
      action: "CONFIRM",
      token,
    })
      .then((result) => {
        setMessage(result.message);
        window.history.replaceState({}, "", "/verify-email-change");
      })
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to confirm this email change.",
        ),
      );
  }, []);

  const destination =
    user?.role === "TRAINER"
      ? "/dashboard/profile"
      : user?.role === "ADMIN"
        ? "/admin"
        : "/profile";
  return (
    <Shell
      title="Confirm email change"
      subtitle="This secure link can be used once and expires after 30 minutes."
    >
      <div className="panel max-w-xl space-y-5">
        <Notice
          error={error}
          message={message || (!error ? "Confirming your new email…" : "")}
        />
        {(message || error) && (
          <Link href={destination} className="button inline-block">
            Return to your account
          </Link>
        )}
      </div>
    </Shell>
  );
}
