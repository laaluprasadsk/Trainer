import { PolicyPage } from "@/components/PolicyPage";

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms of Service"
      intro="These draft terms explain the intended relationship between clients, trainers, and the Trainrr marketplace."
      sections={[
        {
          title: "Marketplace role",
          body: "Trainrr helps clients discover trainers, reserve published sessions, and make payments. Trainers remain responsible for the professional services they provide and for keeping their credentials, profile, and availability accurate.",
        },
        {
          title: "Accounts and eligibility",
          body: "Customers must provide accurate account information, protect access to their account, and use the service lawfully. Trainer profiles are public only after administrative review and publication.",
        },
        {
          title: "Health and safety",
          body: "Exercise carries risk. PAR-Q answers and fitness goals may help a trainer prepare, but they are not medical diagnosis or treatment. Customers should seek appropriate medical advice when needed and stop exercising if they experience concerning symptoms.",
        },
        {
          title: "Bookings and payments",
          body: "The price, session method, date, time, platform fee, and applicable cancellation information are shown before checkout. A booking is confirmed only after server-side payment verification. Payment-provider and marketplace terms may also apply.",
        },
        {
          title: "Conduct and support",
          body: "Clients and trainers must act respectfully and safely. Suspected fraud, unsafe conduct, or account misuse may be investigated and access may be limited. Contact support with a booking reference when reporting an issue.",
        },
      ]}
    />
  );
}
