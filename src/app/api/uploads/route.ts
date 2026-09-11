import { storeUpload } from "@/lib/storage";
import sharp from "sharp";
import { api, assert } from "@/lib/http";
import { requireUser, rateLimit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const POST = api(async (req) => {
  const u = await requireUser();
  await rateLimit(`upload:${u.id}`, 10);
  assert(
    Number(req.headers.get("content-length") || 0) < 2200000,
    "File must be under 2 MB.",
    413,
  );
  const form = await req.formData();
  const file = form.get("file");
  assert(
    file instanceof File && file.size <= 2 * 1024 * 1024 && file.size > 0,
    "Choose a PDF, PNG or JPEG under 2 MB.",
  );
  const data = Buffer.from(await file.arrayBuffer());
  const mime =
    data.subarray(0, 5).toString() === "%PDF-"
      ? "application/pdf"
      : data
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        ? "image/png"
        : data[0] === 255 && data[1] === 216 && data[2] === 255
          ? "image/jpeg"
          : null;
  assert(
    mime && mime === file.type,
    "File contents must match PDF, PNG or JPEG type.",
  );
  if (form.get("purpose") === "avatar") {
    assert(
      mime === "image/png" || mime === "image/jpeg",
      "Choose a PNG or JPEG photo.",
    );
    const normalized = await sharp(data, { limitInputPixels: 16000000 })
      .rotate()
      .resize(512, 512, { fit: "cover" })
      .jpeg({ quality: 85 })
      .toBuffer();
    const photo = await storeUpload(u.id, "image/jpeg", normalized, true);
    const url = `/api/avatars/${photo.id}`;
    if (u.role === "CLIENT")
      await prisma.clientProfile.update({
        where: { userId: u.id },
        data: { avatarUrl: url },
      });
    if (u.role === "TRAINER")
      await prisma.trainerProfile.update({
        where: { userId: u.id },
        data: { avatarUrl: url },
      });
    return { url };
  }
  const upload = await storeUpload(u.id, mime, data);
  return { url: `/api/uploads/${upload.id}` };
}, true);
