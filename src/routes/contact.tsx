import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, pageHead, Placeholder } from "@/components/site-shell";
import { SUPPORT_WHATSAPP } from "@/lib/notify";

export const Route = createFileRoute("/contact")({
  head: () => pageHead("/contact", "Contact win1 Support", "How to reach win1 support about deposits, withdrawals, account questions or privacy requests."),
  component: Contact,
});

function Contact() {
  return (
    <InfoPage title="Contact">
      <p>
        Support is handled by a small team, so replies are not instant. Please include your registered
        mobile number and, for payment questions, the 12-digit UTR of the transaction.
      </p>
      <h2>WhatsApp support</h2>
      <p>
        <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a>
      </p>
      <h2>Email</h2>
      <p><Placeholder>support email address</Placeholder></p>
      <h2>Support hours</h2>
      <p><Placeholder>support hours and time zone</Placeholder></p>
      <h2>Postal address</h2>
      <p><Placeholder>registered address, if you choose to publish one</Placeholder></p>
      <h2>Common topics</h2>
      <ul>
        <li>A deposit has not been credited yet (deposits are reviewed manually).</li>
        <li>Status of a withdrawal request.</li>
        <li>Requesting deletion of your account data (see the Privacy Policy).</li>
        <li>Asking us to block your account for a break from play.</li>
      </ul>
    </InfoPage>
  );
}
