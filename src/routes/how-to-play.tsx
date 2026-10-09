import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage, pageHead } from "@/components/site-shell";

export const Route = createFileRoute("/how-to-play")({
  head: () => pageHead("/how-to-play", "How to Play — win1 Game Rules", "Plain-language rules for every win1 game: Aviator crash, Fortune Gems 2, Neon Reels 777, Mines, Roulette and the card game."),
  component: HowToPlay,
});

function HowToPlay() {
  return (
    <InfoPage title="How to Play & Game Rules">
      <p>Every game below is a game of chance. Try any of them in demo mode first — guest players get free virtual coins that have no cash value.</p>
      <h2>Aviator (crash)</h2>
      <p>During the countdown, place one bet. When the round starts a multiplier rises from 1.00x until the plane flies away at a random point. Press <strong>Cash Out</strong> before that to win your stake times the current multiplier. If the plane leaves first, the bet is lost. Only one bet per round is allowed, and betting reopens at the next countdown.</p>
      <h2>Fortune Gems 2 (slot)</h2>
      <p>Choose a stake and spin three gem reels plus a multiplier reel. Matching gems on the centre line pay according to the symbol, multiplied by the value on the multiplier reel. A special symbol can trigger a bonus wheel.</p>
      <h2>Neon Reels 777 (slot)</h2>
      <p>A classic three-reel slot. Three matching symbols on the line pay out; wild symbols substitute for others. Bigger wins trigger celebration animations but do not change the odds.</p>
      <h2>Mines</h2>
      <p>Pick how many mines hide in the grid, then reveal tiles one at a time. Each safe tile raises your multiplier; you can cash out at any point. Revealing a mine ends the round and the stake is lost. More mines means higher multipliers and higher risk.</p>
      <h2>Roulette</h2>
      <p>Bet on a number, colour or range, then spin. The payout depends on the type of bet; single numbers pay the most and are the least likely to hit.</p>
      <h2>Card game</h2>
      <p>A simple card game where the outcome is decided by the cards dealt. Your choices are limited, so treat it as a game of chance, not skill.</p>
      <h2>Balances</h2>
      <ul>
        <li><strong>Demo coins</strong> — guests only, no cash value.</li>
        <li><strong>Real cash</strong> — from approved deposits and winnings; used first when you play.</li>
        <li><strong>Bonus cash</strong> — from bonuses; needs 3x wagering before withdrawal.</li>
      </ul>
      <p>Set yourself a limit before playing — see <Link to="/responsible-play">Responsible Play</Link>.</p>
    </InfoPage>
  );
}
