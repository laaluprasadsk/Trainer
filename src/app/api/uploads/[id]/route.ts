import { readUpload } from "@/lib/storage";
import { api, assert } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const GET = api(async (req) => {
  const u = await requireUser();
  const id = new URL(req.url).pathname.split("/").pop();
  const file = await prisma.upload.findUnique({ where: { id } });
  assert(
    file && (u.role === "ADMIN" || file.userId === u.id),
    "Document not found.",
    404,
  );
  return new Response(await readUpload(file), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition":
        'attachment; filename="trainer-document.' +
        (file.mime === "application/pdf"
          ? "pdf"
          : file.mime === "image/png"
            ? "png"
            : "jpg") +
        '"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
});
