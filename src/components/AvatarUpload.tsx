"use client";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import Image from "next/image";
import { Notice } from "./ui/marketplace";
export function AvatarUpload() {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="panel mb-6">
      <h2 className="font-bold mb-3">Profile photo</h2>
      <p className="text-sm text-slate-500 mb-3">
        Your photo is public. PNG or JPEG, maximum 2 MB.
      </p>
      <Notice error={error} />
      {(url || user?.avatarUrl) && (
        <Image
          src={url || user!.avatarUrl!}
          alt="Your profile photo"
          width={80}
          height={80}
          unoptimized
          className="rounded-2xl mb-3"
        />
      )}
      <label className="field">
        {busy ? "Uploading…" : "Upload a photo"}
        <input
          type="file"
          accept="image/png,image/jpeg"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            try {
              const form = new FormData();
              form.set("file", file);
              form.set("purpose", "avatar");
              const r = await fetch("/api/uploads", {
                method: "POST",
                body: form,
              });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              setUrl(d.url);
              setError("");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Unable to upload.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
    </section>
  );
}
