import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, pageHead, Placeholder } from "@/components/site-shell";

export const Route = createFileRoute("/privacy")({
  head: () => pageHead("/privacy", "Privacy Policy — win1", "What data win1 collects (mobile number, payment proofs, game state), how it is stored, and your choices."),
  component: Privacy,
});

function Privacy() {
  return (
    <InfoPage title="Privacy Policy" updated="October 2026">
      <p>This page explains what information win1 handles and why. It describes how the site currently works.</p>
      <h2>Information we collect</h2>
      <ul>
        <li><strong>Mobile number</strong> you enter to sign in.</li>
        <li><strong>Deposit details</strong>: amount, UTR number and the payment screenshot you upload. Screenshots are kept in private storage and only viewed by the operator to verify payments.</li>
        <li><strong>Withdrawal details</strong>: amount and the UPI ID / bank details you provide.</li>
        <li><strong>Referral data</strong> if you sign up with or share a referral code.</li>
        <li><strong>Game and wallet state</strong> (balances, settings) stored in your browser's local storage.</li>
        <li>Standard technical data (such as IP address and browser type) processed by our hosting provider.</li>
      </ul>
      <h2>How we use it</h2>
      <p>To run your account, verify deposits, process withdrawals, prevent bonus abuse and answer support requests. We do not sell personal data.</p>
      <h2>WhatsApp</h2>
      <p>If you contact us or verify through WhatsApp, WhatsApp's own privacy policy applies to that conversation.</p>
      <h2>Cookies and advertising</h2>
      <p>
        The site uses browser storage to keep you signed in and remember game state. Advertising is
        currently switched off. If ads from Google or other vendors are enabled in the future, those
        vendors may use cookies to serve ads based on prior visits; this policy will be updated and
        you can manage personalised ads at{" "}
        <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.
      </p>
      <h2>Retention and deletion</h2>
      <p>Retention period: <Placeholder>how long transaction records are kept</Placeholder>. You can ask for your data to be deleted via the <Link to="/contact">Contact page</Link>, subject to records we must keep for payment disputes.</p>
      <h2>Age</h2>
      <p>The site is not intended for anyone under 18.</p>
      <h2>Data controller</h2>
      <p><Placeholder>operator name and contact email for privacy requests</Placeholder></p>
    </InfoPage>
  );
}
