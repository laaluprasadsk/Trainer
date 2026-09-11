import { randomUUID } from "node:crypto";
import { Upload } from "@prisma/client";
import { prisma } from "./prisma";
import { assert } from "./http";
function config() {
  assert(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
    "Object storage is not configured.",
    503,
  );
  const url = new URL(process.env.SUPABASE_URL);
  assert(url.protocol === "https:", "Object storage requires HTTPS.", 503);
  return {
    url: url.origin,
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  };
}
function objectUrl(path: string) {
  return `${config().url}/storage/v1/object/${path.split("/").map(encodeURIComponent).join("/")}`;
}
export async function storeUpload(
  userId: string,
  mime: string,
  data: Buffer,
  isPublic = false,
) {
  if (process.env.STORAGE_PROVIDER !== "supabase") {
    assert(
      process.env.NODE_ENV !== "production",
      "Production requires object storage.",
      503,
    );
    return prisma.upload.create({
      data: { userId, mime, data: new Uint8Array(data), public: isPublic },
    });
  }
  const bucket = isPublic ? "trainrr-avatars" : "trainrr-certifications";
  const storagePath = `${bucket}/${userId}/${randomUUID()}`;
  const response = await fetch(objectUrl(storagePath), {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: { ...config().headers, "Content-Type": mime, "x-upsert": "false" },
    body: new Uint8Array(data),
  });
  assert(response.ok, "Unable to store the document. Try again.", 503);
  try {
    return await prisma.upload.create({
      data: { userId, mime, storagePath, public: isPublic },
    });
  } catch (error) {
    await fetch(objectUrl(storagePath), {
      method: "DELETE",
      headers: config().headers,
      signal: AbortSignal.timeout(5000),
    }).catch(() => {});
    throw error;
  }
}
// Called only after the route checks document ownership/admin authorization.
// Proxying private bytes avoids leaking a bearer signed URL into history/logs.
export async function readUpload(file: Upload) {
  if (file.data) return new Uint8Array(file.data);
  assert(file.storagePath, "Document not found.", 404);
  const response = await fetch(objectUrl(file.storagePath), {
    headers: config().headers,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  assert(response.ok, "Document storage is temporarily unavailable.", 503);
  return new Uint8Array(await response.arrayBuffer());
}
