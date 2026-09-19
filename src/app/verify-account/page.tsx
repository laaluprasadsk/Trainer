"use client";
import { useEffect, useRef, useState } from "react";
import {
  Shell,
  Notice,
  request,
  useResource,
} from "@/components/ui/marketplace";
export default function VerificationPage() {
  const { data, error, loading, reload } = useResource<{
    email: string;
    phone: string;
    emailVerified: boolean;
    phoneVerified: boolean;
  }>("/api/account/verification");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  const attemptedEmailToken = useRef(false);
  async function act(action: string, suppliedToken?: string) {
    setBusy(true);
    setFailure("");
    setMessage("");
    try {
      const token =
        suppliedToken ??
        new URLSearchParams(window.location.search).get("token");
      const r = await request<{ message: string }>(
        "/api/account/verification",
        "POST",
        { action, otp, token },
      );
      setMessage(r.message);
      if (action === "VERIFY_EMAIL")
        window.history.replaceState({}, "", "/verify-account");
      await reload();
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token || attemptedEmailToken.current) return;
    attemptedEmailToken.current = true;
    void act("VERIFY_EMAIL", token);
    // The link token is consumed once. Re-running on render would show a false
    // already-used error, so this effect intentionally runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Shell
      title="Verify your account"
      subtitle="Verify your email and mobile number before booking."
    >
      <Notice error={failure || error} message={message} />
      {loading && <p>Loading verification status…</p>}
      {data && (
        <div className="max-w-xl space-y-6 rounded-2xl border bg-white p-6">
          <section className="space-y-3">
            <h2 className="font-semibold">Email: {data.email}</h2>
            <p>{data.emailVerified ? "Verified" : "Not verified"}</p>
            {!data.emailVerified && (
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-lg border p-3"
                  disabled={busy}
                  onClick={() => act("SEND_EMAIL")}
                >
                  Send verification email
                </button>
              </div>
            )}
          </section>
          <section className="space-y-3">
            <h2 className="font-semibold">Mobile: {data.phone}</h2>
            <p>{data.phoneVerified ? "Verified" : "Not verified"}</p>
            {!data.phoneVerified && (
              <>
                <button
                  className="rounded-lg border p-3"
                  disabled={busy}
                  onClick={() => act("SEND_PHONE")}
                >
                  Send verification code
                </button>
                <label className="block">
                  Six-digit code
                  <input
                    className="mt-2 block w-full rounded-lg border p-3"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    pattern="[0-9]{6}"
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  />
                </label>
                <button
                  className="rounded-lg bg-emerald-700 p-3 text-white"
                  disabled={busy || otp.length !== 6}
                  onClick={() => act("VERIFY_PHONE")}
                >
                  Verify phone
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </Shell>
  );
}
