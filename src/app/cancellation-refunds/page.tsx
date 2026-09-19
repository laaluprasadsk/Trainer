import { PolicyPage } from "@/components/PolicyPage";

export default function CancellationRefundsPage() {
  return (
    <PolicyPage
      title="Cancellation and Refund Policy"
      intro="This draft reflects the cancellation behavior currently enforced by the Trainrr booking service. Business owners and legal counsel must approve the final commercial policy."
      sections={[
        {
          title: "Before payment",
          body: "An unpaid reservation is held for approximately ten minutes. If payment is not completed before the hold expires, the slot becomes available again.",
        },
        {
          title: "Client cancellation",
          body: "The current application permits clients to cancel a confirmed session at least 24 hours before its scheduled start. The checkout and booking dashboard show this rule before cancellation.",
        },
        {
          title: "Refund processing",
          body: "A captured payment for an eligible cancelled booking enters refund review. The payment is shown as refund pending until the payment provider confirms that the refund was processed. Bank posting times are controlled by the payment provider and issuing bank.",
        },
        {
          title: "Trainer cancellation and disputes",
          body: "Trainer cancellations and exceptional circumstances require platform review. Contact support with the booking ID. Partial refunds currently require manual reconciliation and should not be promised before an operator reviews the case.",
        },
      ]}
    />
  );
}
