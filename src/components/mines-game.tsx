import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bomb, Sparkles, Volume2, VolumeX, RefreshCw, Trophy, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useVault } from "@/lib/vault-store";

// Web Audio Synth for clicks, gems, cashout & explosion
const playMinesAudio = (type: "gem" | "bomb" | "cashout" | "click") => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "gem") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "bomb") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === "cashout") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.2);
      });
    } else if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    }
  } catch {
    // Audio context fallback
  }
};

interface TileState {
  revealed: boolean;
  isBomb: boolean;
}

export function MinesGame() {
  const { user, addScore } = useVault();

  const [betAmount, setBetAmount] = useState<number>(20);
  const [mineCount, setMineCount] = useState<number>(3);
  const [inGame, setInGame] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // 5x5 Matrix (25 Tiles)
  const [tiles, setTiles] = useState<TileState[]>(
    Array(25).fill({ revealed: false, isBomb: false })
  );
  const [revealedGems, setRevealedGems] = useState<number>(0);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [wonCashout, setWonCashout] = useState<number | null>(null);

  // Exact 1win / Stake Fair Multiplier Probability Calculator
  const calculateMultiplier = (mines: number, gemsRevealed: number) => {
    if (gemsRevealed === 0) return 1.0;
    let multiplier = 0.96; // 4% casino house edge
    for (let i = 0; i < gemsRevealed; i++) {
      multiplier = multiplier * ((25 - i) / (25 - mines - i));
    }
    return Number(Math.max(multiplier, 1.01).toFixed(2));
  };

  // Next step multiplier forecast
  const nextMultiplier = calculateMultiplier(mineCount, revealedGems + 1);

  // Start New Round
  const handleStartGame = () => {
    if (inGame) return;

    if (!user || user.balance < betAmount) {
      toast.error("Insufficient balance! Please deposit to play Mines.");
      return;
    }

    if (soundEnabled) playMinesAudio("click");
    addScore(-betAmount);

    // Randomize bombs placement on 25 tiles
    const bombIndices = new Set<number>();
    while (bombIndices.size < mineCount) {
      bombIndices.add(Math.floor(Math.random() * 25));
    }

    const newTiles: TileState[] = Array(25)
      .fill(null)
      .map((_, index) => ({
        revealed: false,
        isBomb: bombIndices.has(index),
      }));

    setTiles(newTiles);
    setRevealedGems(0);
    setCurrentMultiplier(1.0);
    setWonCashout(null);
    setGameOver(false);
    setInGame(true);
  };

  // Click on a tile
  const handleTileClick = (index: number) => {
    if (!inGame || tiles[index]?.revealed || gameOver) return;

    const clickedTile = tiles[index];
    if (!clickedTile) return;

    if (clickedTile.isBomb) {
      // Bomb Hit! Game Over!
      if (soundEnabled) playMinesAudio("bomb");
      setGameOver(true);
      setInGame(false);

      // Reveal all bombs and tiles
      setTiles((prev) =>
        prev.map((t) => ({ ...t, revealed: true }))
      );

      toast.error(`💥 BOOM! You hit a mine. -₹${betAmount}`);
    } else {
      // Safe Gem Found!
      if (soundEnabled) playMinesAudio("gem");
      const nextGems = revealedGems + 1;
      const nextMulti = calculateMultiplier(mineCount, nextGems);

      setRevealedGems(nextGems);
      setCurrentMultiplier(nextMulti);

      setTiles((prev) => {
        const updated = [...prev];
        updated[index] = { isBomb: false, ...updated[index], revealed: true };
        return updated;
      });

      // If all safe tiles opened
      if (nextGems === 25 - mineCount) {
        handleCashout(nextMulti);
      }
    }
  };

  // Cashout current winnings
  const handleCashout = (forcedMulti?: number) => {
    if (!inGame || revealedGems === 0) return;

    const finalMulti = forcedMulti || currentMultiplier;
    const payout = Math.round(betAmount * finalMulti);

    if (soundEnabled) playMinesAudio("cashout");
    addScore(payout);
    setWonCashout(payout);
    setInGame(false);
    setGameOver(true);

    // Reveal full board on cashout
    setTiles((prev) => prev.map((t) => ({ ...t, revealed: true })));

    toast.success(`🎉 CASHOUT! Won ₹${payout.toLocaleString("en-IN")} (${finalMulti}x)`);
  };

  return (
    <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-[#0a0e17] p-3.5 shadow-2xl font-sans select-none text-slate-100">
      
      {/* Header Deck */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
            <Bomb className="size-4 text-sky-400" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight text-white">MINES</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase">1WIN CASINO ORIGINAL</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-lg border border-slate-800 bg-[#101624] p-1.5 text-slate-400 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="size-4 text-sky-400" /> : <VolumeX className="size-4" />}
          </button>
          <div className="flex items-center gap-1 rounded-lg border border-sky-500/30 bg-sky-950/30 px-2.5 py-1 text-xs font-black text-sky-400">
            <span>{currentMultiplier}x</span>
          </div>
        </div>
      </div>

      {/* Win / Cashout Notification */}
      {wonCashout && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-3.5 py-2 animate-in zoom-in-95">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">Cashout Success!</span>
          </div>
          <span className="text-sm font-black text-emerald-400 font-mono">
            +₹{wonCashout.toLocaleString("en-IN")}
          </span>
        </div>
      )}

      {/* 5x5 Mines Tile Grid */}
      <div className="relative rounded-2xl border border-slate-800 bg-[#0d121c] p-2.5 shadow-inner">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {tiles.map((tile, i) => (
            <button
              key={i}
              type="button"
              disabled={!inGame && !gameOver}
              onClick={() => handleTileClick(i)}
              className={`relative aspect-square w-full rounded-xl border flex items-center justify-center transition-all duration-150 ${
                tile.revealed
                  ? tile.isBomb
                    ? "bg-gradient-to-br from-rose-600 via-red-700 to-red-950 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)] scale-95"
                    : "bg-gradient-to-br from-sky-500/40 via-blue-600/30 to-[#0c1322] border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.4)] scale-95"
                  : inGame
                  ? "bg-[#141b29] border-slate-700/80 hover:bg-[#1c263a] hover:border-sky-500/50 active:scale-95 shadow-md cursor-pointer"
                  : "bg-[#101624] border-slate-800/80 cursor-default opacity-80"
              }`}
            >
              {tile.revealed && (
                <div className="animate-in zoom-in-50 duration-150">
                  {tile.isBomb ? (
                    <Bomb className="size-5 sm:size-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                  ) : (
                    <div className="relative flex flex-col items-center justify-center">
                      <Sparkles className="size-5 sm:size-6 text-sky-300 drop-shadow-[0_0_8px_#38bdf8] animate-pulse" />
                    </div>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* In-Game Live Control Deck */}
      <div className="mt-3 space-y-2.5 border-t border-slate-800/80 pt-3">
        
        {/* Mines Count & Next Multiplier Strip */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="size-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-400">Mines:</span>
            {!inGame ? (
              <select
                value={mineCount}
                onChange={(e) => setMineCount(Number(e.target.value))}
                className="rounded-lg border border-slate-700 bg-[#121826] px-2 py-0.5 text-xs font-black text-white outline-none focus:border-sky-500"
              >
                {[1, 2, 3, 5, 10, 15, 20, 24].map((cnt) => (
                  <option key={cnt} value={cnt}>
                    {cnt} Mines
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-black text-rose-400 font-mono">{mineCount} Mines</span>
            )}
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold block -mb-0.5">NEXT TILE</span>
            <span className="text-xs font-black text-sky-400 font-mono">{nextMultiplier}x</span>
          </div>
        </div>

        {/* Bet Selector (Disabled during active game) */}
        {!inGame && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">Bet Amount</span>
            <div className="flex items-center gap-1">
              {[20, 50, 100, 200, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setBetAmount(amt)}
                  className={`h-7 px-2.5 rounded-lg text-[11px] font-black border transition-all ${
                    betAmount === amt
                      ? "bg-sky-500 border-sky-400 text-slate-950 shadow-md"
                      : "bg-[#121826] border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Action Buttons: Bet or Cashout */}
        {inGame ? (
          <Button
            type="button"
            onClick={() => handleCashout()}
            disabled={revealedGems === 0}
            className={`w-full py-5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 ${
              revealedGems > 0
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25 animate-pulse"
                : "bg-[#182030] text-slate-500 border border-slate-800 cursor-not-allowed"
            }`}
          >
            {revealedGems > 0
              ? `Cash Out ₹${Math.round(betAmount * currentMultiplier).toLocaleString("en-IN")} (${currentMultiplier}x)`
              : "Pick a Tile First"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleStartGame}
            className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
          >
            Start Bet ₹{betAmount}
          </Button>
        )}

      </div>
    </div>
  );
}

export default MinesGame;
      
