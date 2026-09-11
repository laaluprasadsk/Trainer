import { readUpload } from "@/lib/storage";
import { api, assert } from "@/lib/http";
import { prisma } from "@/lib/prisma";
export const GET = api(async (req) => {
  const id = new URL(req.url).pathname.split("/").pop();
  const file = await prisma.upload.findFirst({
    where: { id, public: true, mime: "image/jpeg" },
  });
  assert(file, "Photo not found.", 404);
  return new Response(await readUpload(file), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
