import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, pageHead } from "@/components/site-shell";

export const Route = createFileRoute("/responsible-play")({
  head: () => pageHead("/responsible-play", "Responsible Play — win1", "Practical advice for keeping play safe: 18+ only, set money and time limits, warning signs, and where to get help."),
  component: Responsible,
});

function Responsible() {
  return (
    <InfoPage title="Responsible Play">
      <p>Games on win1 are designed for entertainment. With real-money play you can lose what you deposit, and over time the house is more likely to come out ahead than you are.</p>
      <h2>Good habits</h2>
      <ul>
        <li>Only play with money you can afford to lose — never with rent, bills or borrowed money.</li>
        <li>Decide a budget and a time limit before you start, and stop when you reach either.</li>
        <li>Don't chase losses by betting more to win money back.</li>
        <li>Use demo mode if you just want to enjoy the games.</li>
        <li>Take regular breaks, and don't play when stressed, upset or after drinking.</li>
      </ul>
      <h2>Warning signs</h2>
      <ul>
        <li>Spending more money or time than you planned.</li>
        <li>Hiding play from family or friends.</li>
        <li>Feeling anxious or irritable when not playing.</li>
        <li>Borrowing money or selling things to play.</li>
      </ul>
      <h2>Taking a break</h2>
      <p>The site has no automated self-exclusion tool yet. You can ask support to block your account through the <Link to="/contact">Contact page</Link>, and we will stop accepting deposits from it.</p>
      <h2>Getting help</h2>
      <p>If gambling is causing you harm, talk to someone you trust or a qualified counsellor. In India you can call the Tele-MANAS mental health helpline on <strong>14416</strong>. Internationally, <a href="https://www.gamblingtherapy.org" target="_blank" rel="noopener noreferrer">Gambling Therapy</a> offers free support.</p>
      <h2>Under 18?</h2>
      <p>This site is not for you. Parents can use device-level filtering tools to restrict access.</p>
    </InfoPage>
  );
}
