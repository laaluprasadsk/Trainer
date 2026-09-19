import { PolicyPage } from "@/components/PolicyPage";

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro="This draft summarizes the information Trainrr currently processes to operate accounts, trainer discovery, bookings, support, and safety features."
      sections={[
        {
          title: "Information collected",
          body: "Account details include name, email, phone number, profile photo, location, and fitness goals. Booking records include trainer, date, time, method, price, payment references, status, notifications, and reviews. Trainer applications include certification documents.",
        },
        {
          title: "Health and PAR-Q information",
          body: "PAR-Q answers can reveal sensitive health information. They are used to support session safety and should be accessible only to authorized participants and operators. They are not used to make medical diagnoses or sold for advertising.",
        },
        {
          title: "How information is used",
          body: "Information is used to authenticate users, publish approved trainer profiles, process bookings and payments, deliver service messages, prevent abuse, provide support, and meet operational or legal obligations.",
        },
        {
          title: "Service providers and retention",
          body: "Trainrr may use hosting, database, storage, payment, email, and SMS providers to deliver the service. Final retention periods, deletion procedures, international transfer wording, and statutory bases require legal and operational approval before launch.",
        },
        {
          title: "Your choices",
          body: "Customers can update profile information in their dashboard and can contact support to request access, correction, or deletion. Some booking and payment records may need to be retained for fraud prevention, accounting, disputes, or legal requirements.",
        },
      ]}
    />
  );
}
