"use client";
import { FormEvent, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Notice, request } from "@/components/ui/marketplace";
export default function Page() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await request<{ message: string }>(
        "/api/contact",
        "POST",
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      setMessage(r.message);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Navbar />
      <main className="market-shell">
        <form onSubmit={submit} className="panel max-w-xl mx-auto space-y-5">
          <p className="eyebrow">WE ARE HERE TO HELP</p>
          <h1 className="text-3xl font-bold">Contact Trainrr</h1>
          <Notice error={error} message={message} />
          <label className="field">
            Your email
            <input name="email" type="email" required />
          </label>
          <label className="field">
            How can we help?
            <textarea name="message" required maxLength={2000} rows={6} />
          </label>
          <button disabled={busy} className="button">
            Send message
          </button>
        </form>
      </main>
    </>
  );
}
