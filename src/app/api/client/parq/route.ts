import { api, body, assert } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const POST = api(async (req) => {
  const u = await requireUser("CLIENT");
  const b = await body(req);
  const a = b.answers;
  assert(
    a && typeof a === "object" && !Array.isArray(a),
    "Answer every screening question.",
  );
  const record = a as Record<string, unknown>;
  const answers = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"].map(
    (k) => record[k],
  );
  assert(
    answers.every((v) => typeof v === "boolean"),
    "Answer all seven questions.",
  );
  const risk = answers.some(Boolean);
  const data = {
    hasHeartCondition: answers[0] as boolean,
    hasChestPainActivity: (answers[1] || answers[2]) as boolean,
    hasDizzinessLoss: answers[3] as boolean,
    hasBoneJointProblem: answers[4] as boolean,
    takingBpHeartMed: answers[5] as boolean,
    knowsOtherReason: answers[6] as boolean,
    requiresMedClearance: risk,
    isCleared: !risk,
  };
  const waiver = await prisma.parqWaiver.upsert({
    where: { clientId: u.clientProfile!.id },
    create: { clientId: u.clientProfile!.id, ...data },
    update: { ...data, signedAt: new Date() },
  });
  return {
    waiverId: waiver.id,
    isCleared: !risk,
    status: risk ? "REQUIRES_MEDICAL_CLEARANCE" : "CLEARED",
  };
}, true);
