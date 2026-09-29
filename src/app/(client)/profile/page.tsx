"use client";
import { AvatarUpload } from "@/components/AvatarUpload";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Shell,
  Notice,
  Empty,
  request,
  useResource,
} from "@/components/ui/marketplace";
export default function Page() {
  const { data, error, loading, setData } = useResource<{
    profile: {
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
      defaultLocationName: string;
      fitnessGoals: string[];
    };
  }>("/api/client/profile");
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const attemptedEmailChange = useRef(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get(
      "emailChangeToken",
    );
    if (!token || attemptedEmailChange.current) return;
    attemptedEmailChange.current = true;
    setBusy(true);
    request<{ message: string; email: string }>("/api/account/email", "POST", {
      action: "CONFIRM",
      token,
    })
      .then((result) => {
        setMessage(result.message);
        setData((current) =>
          current
            ? { profile: { ...current.profile, email: result.email } }
            : current,
        );
        window.history.replaceState({}, "", "/profile");
      })
      .catch((reason) =>
        setFailure(
          reason instanceof Error ? reason.message : "Unable to change email.",
        ),
      )
      .finally(() => setBusy(false));
  }, [setData]);

  async function requestEmailChange(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setFailure("");
    setMessage("");
    const form = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const result = await request<{ message: string }>(
        "/api/account/email",
        "POST",
        { action: "REQUEST", ...form },
      );
      setMessage(result.message);
      e.currentTarget.reset();
    } catch (reason) {
      setFailure(
        reason instanceof Error ? reason.message : "Unable to change email.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function save(e: FormEvent<HTMLFormElement>, password = false) {
    e.preventDefault();
    setBusy(true);
    setFailure("");
    setMessage("");
    const f = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const saved = await request<{
        profile: {
          firstName: string;
          lastName: string;
          phone: string;
          email: string;
          defaultLocationName: string;
          fitnessGoals: string[];
        };
      }>(
        password ? "/api/auth/password" : "/api/client/profile",
        "POST",
        password
          ? f
          : {
              ...f,
              fitnessGoals: String(f.fitnessGoals)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            },
      );
      if (!password && saved.profile) setData({ profile: saved.profile });
      setMessage(password ? "Password updated." : "Profile saved.");
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell
      title="Your profile"
      subtitle="Keep your details and training goals up to date."
    >
      <Notice error={error || failure} message={message} />
      <AvatarUpload />
      {loading ? (
        <Empty>Loading profile…</Empty>
      ) : (
        data && (
          <form
            key={`${data.profile.firstName}:${data.profile.lastName}:${data.profile.phone}:${data.profile.defaultLocationName}:${data.profile.fitnessGoals.join("|")}`}
            onSubmit={(e) => save(e)}
            className="panel grid sm:grid-cols-2 gap-5 mb-8"
          >
            {[
              ["firstName", "First name"],
              ["lastName", "Last name"],
              ["phone", "Phone"],
              ["defaultLocationName", "Location"],
            ].map(([k, label]) => (
              <label className="field" key={k}>
                {label}
                <input
                  name={k}
                  required={k !== "defaultLocationName"}
                  maxLength={
                    k === "phone" ? 30 : k === "defaultLocationName" ? 160 : 80
                  }
                  type={k === "phone" ? "tel" : "text"}
                  autoComplete={
                    k === "phone"
                      ? "tel"
                      : k === "firstName"
                        ? "given-name"
                        : k === "lastName"
                          ? "family-name"
                          : "street-address"
                  }
                  defaultValue={data.profile[k as "firstName"] || ""}
                />
              </label>
            ))}
            <label className="field sm:col-span-2">
              Fitness goals (comma separated)
              <textarea
                name="fitnessGoals"
                maxLength={1200}
                defaultValue={data.profile.fitnessGoals.join(", ")}
              />
            </label>
            <p className="text-sm text-slate-500">
              Account email: {data.profile.email}
            </p>
            <button disabled={busy} className="button">
              Save profile
            </button>
          </form>
        )
      )}
      <form
        onSubmit={(e) => save(e, true)}
        className="panel grid sm:grid-cols-2 gap-5"
      >
        <h2 className="text-xl font-bold sm:col-span-2">Password & security</h2>
        <label className="field">
          Current password
          <input
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
        <label className="field">
          New password
          <input
            name="password"
            type="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
          />
        </label>
        <button disabled={busy} className="button">
          Change password
        </button>
      </form>
      <form
        onSubmit={requestEmailChange}
        className="panel mt-6 grid gap-5 sm:grid-cols-2"
      >
        <h2 className="text-xl font-bold sm:col-span-2">Change email</h2>
        <p className="text-sm text-slate-600 sm:col-span-2">
          We will send a 30-minute confirmation link to the new address. Your
          current email stays active until you confirm it.
        </p>
        <label className="field">
          New email
          <input
            name="newEmail"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
          />
        </label>
        <label className="field">
          Current password
          <input
            name="currentPassword"
            type="password"
            required
            maxLength={128}
            autoComplete="current-password"
          />
        </label>
        <button disabled={busy} className="button">
          Send confirmation
        </button>
      </form>
      <section className="panel mt-6 text-sm text-slate-600">
        <h2 className="mb-2 text-lg font-bold text-slate-900">Account data</h2>
        <p>
          To request a data copy, correction, or account deletion, contact
          support from your account email. Some booking and payment records may
          need to be retained for legal, accounting, fraud, or dispute purposes.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/contact" className="nav-pill">
            Submit a data request
          </Link>
          <Link href="/privacy" className="nav-pill">
            Privacy information
          </Link>
        </div>
      </section>
    </Shell>
  );
}
