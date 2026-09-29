"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "./layout/Navbar";
import { Notice, request } from "./ui/marketplace";
import { AuthUser, useAuth } from "@/lib/auth-context";
import { safeInternalRedirect } from "@/lib/safe-redirect";

export function EmailOtpLogin() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await request<{ message: string }>(
        "/api/auth/send-otp",
        "POST",
        { email },
      );
      setSent(true);
      setCooldown(60);
      setMessage(result.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await request<{ user: AuthUser }>(
        "/api/auth/verify-otp",
        "POST",
        { email, otp },
      );
      login(result.user);
      const requested = new URLSearchParams(window.location.search).get("next");
      const next =
        safeInternalRedirect(requested) ||
        (result.user.role === "TRAINER"
          ? "/dashboard"
          : result.user.role === "ADMIN"
            ? "/admin"
            : "/bookings");
      router.push(next);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-lg px-5 py-16">
        <p className="eyebrow">SECURE SIGN IN</p>
        <h1 className="mb-3 text-4xl font-bold">Email me a code.</h1>
        <p className="mb-8 text-slate-500">
          Use a single-use six-digit code instead of your password.
        </p>
        <form onSubmit={sent ? verify : send} className="panel space-y-5">
          <Notice error={error} message={message} />
          <label className="field">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              disabled={sent}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          {sent && (
            <label className="field">
              Six-digit code
              <input
                name="otp"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, ""))
                }
              />
            </label>
          )}
          <button
            disabled={busy || (sent && otp.length !== 6)}
            className="button w-full"
          >
            {busy ? "Please wait…" : sent ? "Verify and sign in" : "Send code"}
          </button>
          {sent && (
            <div className="flex flex-wrap justify-between gap-3 text-sm">
              <button
                type="button"
                className="nav-pill"
                disabled={busy || cooldown > 0}
                onClick={() => void send()}
              >
                {cooldown ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
              <button
                type="button"
                className="nav-pill"
                onClick={() => {
                  setSent(false);
                  setOtp("");
                  setMessage("");
                }}
              >
                Change email
              </button>
            </div>
          )}
          <Link href="/login" className="block text-center text-sm underline">
            Sign in with password
          </Link>
        </form>
      </main>
    </>
  );
}
