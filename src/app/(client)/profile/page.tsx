"use client";
import { AvatarUpload } from "@/components/AvatarUpload";
import { FormEvent, useState } from "react";
import {
  Shell,
  Notice,
  Empty,
  request,
  useResource,
} from "@/components/ui/marketplace";
export default function Page() {
  const { data, error, loading } = useResource<{
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
  async function save(e: FormEvent<HTMLFormElement>, password = false) {
    e.preventDefault();
    setBusy(true);
    setFailure("");
    const f = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await request(
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
                  required
                  defaultValue={data.profile[k as "firstName"] || ""}
                />
              </label>
            ))}
            <label className="field sm:col-span-2">
              Fitness goals (comma separated)
              <textarea
                name="fitnessGoals"
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
    </Shell>
  );
}
