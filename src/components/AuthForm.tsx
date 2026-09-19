"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "./layout/Navbar";
import { request, Notice } from "./ui/marketplace";
import { AuthUser, useAuth } from "@/lib/auth-context";
export function AuthForm({
  mode,
}: {
  mode: "login" | "register" | "forgot" | "reset";
}) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = Object.fromEntries(new FormData(e.currentTarget));
    if (
      (mode === "register" || mode === "reset") &&
      form.password !== form.confirmPassword
    ) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      const result = await request<{ user?: AuthUser; message?: string }>(
        `/api/auth/${mode}`,
        "POST",
        {
          ...form,
          ...(mode === "reset"
            ? {
                token: new URLSearchParams(window.location.search).get("token"),
              }
            : {}),
        },
      );
      if (result.user) {
        login(result.user);
        const requested = new URLSearchParams(window.location.search).get(
          "next",
        );
        const safeRequested =
          requested?.startsWith("/") && !requested.startsWith("//")
            ? requested
            : "";
        router.push(
          mode === "register"
            ? result.user.role === "CLIENT"
              ? "/verify-account"
              : "/onboarding"
            : safeRequested ||
                (result.user.role === "TRAINER"
                  ? "/dashboard"
                  : result.user.role === "ADMIN"
                    ? "/admin"
                    : "/bookings"),
        );
        router.refresh();
      } else setMessage(result.message || "Saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-5 py-16">
        <p className="eyebrow">MAKE TIME FOR YOURSELF</p>
        <h1 className="text-4xl font-bold mb-3">
          {mode === "register"
            ? "Your next chapter."
            : mode === "login"
              ? "Welcome back."
              : mode === "forgot"
                ? "Forgot password?"
                : "Set a new password."}
        </h1>
        <p className="text-slate-500 mb-8">
          A stronger routine starts with the right support.
        </p>
        <form onSubmit={submit} className="panel space-y-5">
          <Notice error={error} message={message} />
          {mode === "register" && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="field">
                  First name
                  <input
                    name="firstName"
                    required
                    maxLength={80}
                    autoComplete="given-name"
                  />
                </label>
                <label className="field">
                  Last name
                  <input
                    name="lastName"
                    required
                    maxLength={80}
                    autoComplete="family-name"
                  />
                </label>
              </div>
              <label className="field">
                Phone with country code
                <input
                  name="phone"
                  type="tel"
                  required
                  placeholder="+919876543210"
                  autoComplete="tel"
                  maxLength={30}
                />
              </label>
              <label className="field">
                I want to
                <select name="role">
                  <option value="CLIENT">Find a personal trainer</option>
                  <option value="TRAINER">Offer personal training</option>
                </select>
              </label>
            </>
          )}
          {mode !== "reset" && (
            <label className="field">
              Email
              <input name="email" type="email" required autoComplete="email" />
            </label>
          )}
          {mode !== "forgot" && (
            <>
              <label className="field">
                Password
                <span className="flex gap-2">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={mode === "login" ? 1 : 12}
                    maxLength={128}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                  <button
                    type="button"
                    className="nav-pill shrink-0"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </span>
                {mode !== "login" && (
                  <span className="text-xs text-slate-500">
                    Use 12 to 128 characters.
                  </span>
                )}
              </label>
              {(mode === "register" || mode === "reset") && (
                <label className="field">
                  Confirm password
                  <span className="flex gap-2">
                    <input
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      required
                      minLength={12}
                      maxLength={128}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="nav-pill shrink-0"
                      aria-label={
                        showConfirm
                          ? "Hide confirmed password"
                          : "Show confirmed password"
                      }
                      aria-pressed={showConfirm}
                      onClick={() => setShowConfirm((value) => !value)}
                    >
                      {showConfirm ? "Hide" : "Show"}
                    </button>
                  </span>
                </label>
              )}
            </>
          )}
          {mode === "register" && (
            <p className="text-xs leading-5 text-slate-500">
              By creating an account, you agree to the{" "}
              <Link className="underline" href="/terms">
                Terms of Service
              </Link>{" "}
              and acknowledge the{" "}
              <Link className="underline" href="/privacy">
                Privacy Policy
              </Link>
              .
            </p>
          )}
          <button disabled={busy} className="button w-full">
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : mode === "register"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Send reset link"
                    : "Reset password"}
          </button>
          <div className="flex flex-wrap justify-between text-sm gap-4">
            <Link href={mode === "register" ? "/login" : "/register"}>
              {mode === "register"
                ? "Already a member? Sign in"
                : "Create an account"}
            </Link>
            <Link href="/forgot-password">Forgot password?</Link>
          </div>
        </form>
      </main>
    </>
  );
}
