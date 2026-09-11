"use client";
import {
  Shell,
  Metrics,
  Notice,
  Empty,
  money,
  useResource,
} from "@/components/ui/marketplace";
export default function Page() {
  const { data, error, loading } = useResource<{
    summary: Record<string, number>;
    payments: {
      id: string;
      status: string;
      grossAmount: string;
      platformFee: string;
      trainerAmount: string;
      gatewayPaymentId: string | null;
      createdAt: string;
    }[];
  }>("/api/trainers/payouts");
  return (
    <Shell
      title="Your earnings"
      subtitle="Actual captured payments, commission and settlement records."
    >
      <Notice error={error} />
      {loading ? (
        <Empty>Loading earnings…</Empty>
      ) : (
        data && (
          <>
            <Metrics
              items={Object.fromEntries(
                Object.entries(data.summary).map(([k, v]) => [k, money(v)]),
              )}
            />
            <div className="panel mb-6 text-sm text-slate-600">
              The commission recorded for each booking is shown below. Pending funds
              are not yet paid out. Trainer transfers require a separate payout
              integration; session completion does not imply a bank transfer.
            </div>
            {data.payments.length ? (
              data.payments.map((p) => (
                <article key={p.id} className="panel mb-3">
                  <span className="badge">{p.status}</span>
                  <p className="mt-3">
                    Gross {money(p.grossAmount)} · Commission{" "}
                    {money(p.platformFee)} · Trainer share{" "}
                    {money(p.trainerAmount)}
                  </p>
                  <p className="text-xs text-slate-500 break-all mt-2">
                    {p.createdAt.slice(0, 10)} ·{" "}
                    {p.gatewayPaymentId || "Awaiting payment"}
                  </p>
                </article>
              ))
            ) : (
              <Empty>No transactions yet.</Empty>
            )}
          </>
        )
      )}
    </Shell>
  );
}
