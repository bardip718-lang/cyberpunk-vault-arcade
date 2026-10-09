import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, pageHead, Placeholder } from "@/components/site-shell";

export const Route = createFileRoute("/terms")({
  head: () => pageHead("/terms", "Terms & Conditions — win1", "Rules for using win1: eligibility, demo coins, deposits, bonuses with 3x wagering, withdrawals and limits of liability."),
  component: Terms,
});

function Terms() {
  return (
    <InfoPage title="Terms & Conditions" updated="October 2026">
      <p>By using win1 you agree to these terms. If you do not agree, please do not use the site.</p>
      <h2>1. Eligibility</h2>
      <p>You must be at least 18 and it must be legal for you to play real-money games of chance where you live. Online real-money gaming is restricted or prohibited in several Indian states and in many countries; you are responsible for checking your local law.</p>
      <h2>2. Demo coins</h2>
      <p>Guest players receive virtual demo coins. They have no monetary value and cannot be deposited, withdrawn, transferred or exchanged for money.</p>
      <h2>3. Deposits</h2>
      <p>Deposits are made by UPI to the details shown in the deposit screen, then submitted with the UTR and a screenshot. Each deposit is checked manually and credited only after approval. Incorrect or unverifiable submissions may be rejected.</p>
      <h2>4. Bonuses</h2>
      <p>Signup, daily and referral bonuses are credited to a separate bonus balance. Bonus money must be wagered 3x before related funds can be withdrawn. One signup bonus per person, phone number and device.</p>
      <h2>5. Withdrawals</h2>
      <p>Withdrawals require a signed-in account and at least one approved deposit of ₹100 or more. Requests are reviewed manually; the amount is held from your balance while pending and returned if rejected.</p>
      <h2>6. Game outcomes</h2>
      <p>All games are games of chance. Results are produced by the site's software. We do not guarantee any win rate or payout percentage. In case of a technical fault, affected rounds may be voided.</p>
      <h2>7. Abuse</h2>
      <p>Multiple accounts, fake payment proofs or exploiting bugs may lead to account closure and forfeiture of bonus funds.</p>
      <h2>8. Liability</h2>
      <p>The site is provided "as is". To the extent permitted by law, we are not liable for losses from gameplay, downtime or third-party payment services.</p>
      <h2>9. Governing law</h2>
      <p><Placeholder>governing law and jurisdiction</Placeholder></p>
      <p>Questions: <Link to="/contact">Contact</Link>.</p>
    </InfoPage>
  );
}
