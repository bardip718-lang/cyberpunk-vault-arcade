import React, { useRef, useEffect, useState } from "react";
import { Volume2, VolumeX, Minus, Plus } from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";

// High-precision Web Audio Engine for authentic Casino Soundscape
class SlotAudioEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playSpinTick() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playReelStop() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playWinFanfare(isBig: boolean) {
    this.init();
    if (!this.ctx) return;
    const notes = isBig
      ? [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5]
      : [392.0, 523.25, 659.25, 783.99];

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isBig ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.09);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.09 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.09);
      osc.stop(this.ctx.currentTime + idx * 0.09 + 0.3);
    });
  }
}

const audio = new SlotAudioEngine();

// Symbols definition
const SYMBOLS = ["garuda", "ruby", "sapphire", "emerald", "A", "K", "Q", "J"] as const;
type SymbolType = (typeof SYMBOLS)[number];

const MULTIPLIERS = [1, 2, 3, 5, 10, 15, "WHEEL"] as const;

export function ReelGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user, addScore } = useVault();

  const [bet, setBet] = useState(30);
  const [extraBet, setExtraBet] = useState(false);
  const [sound, setSound] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winDisplay, setWinDisplay] = useState(0);

  // Engine internal state
  const stateRef = useRef({
    reels: [
      { y: 0, speed: 0, stopping: false, finalSymbols: ["garuda", "ruby", "sapphire"] },
      { y: 0, speed: 0, stopping: false, finalSymbols: ["ruby", "ruby", "sapphire"] },
      { y: 0, speed: 0, stopping: false, finalSymbols: ["garuda", "ruby", "emerald"] },
      { y: 0, speed: 0, stopping: false, finalSymbols: [2, 5, 10] }, // 4th Special Reel
    ],
    wheelAngle: 0,
    wheelSpeed: 0,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>,
    laserActive: false,
    bigWinActive: false,
    bigWinAmount: 0,
  });

  const totalBet = extraBet ? Math.round(bet * 1.5) : bet;

  // Real Canvas 2D Game Loop (60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = stateRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear & Aztec Temple Background
      ctx.fillStyle = "#0c0401";
      ctx.fillRect(0, 0, width, height);

      // Temple Pillar Gradients
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#381704");
      bgGrad.addColorStop(0.35, "#1c0b02");
      bgGrad.addColorStop(1, "#0a0300");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Render Aztec Multiplier Wheel (Top Section)
      const wheelCenterX = width / 2;
      const wheelCenterY = 90;
      const wheelRadius = 110;

      ctx.save();
      ctx.translate(wheelCenterX, wheelCenterY);
      state.wheelAngle += state.wheelSpeed;
      ctx.rotate((state.wheelAngle * Math.PI) / 180);

      // Outer Gold Bezel
      ctx.beginPath();
      ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 8;
      ctx.stroke();

      // Multiplier Segments
      const segments = [
        { label: "20,000", color: "#9333ea" },
        { label: "200", color: "#16a34a" },
        { label: "20", color: "#dc2626" },
        { label: "600", color: "#0284c7" },
        { label: "100", color: "#78350f" },
        { label: "1,000", color: "#0284c7" },
        { label: "4,000", color: "#ea580c" },
        { label: "160", color: "#dc2626" },
        { label: "2,000", color: "#ca8a04" },
        { label: "60", color: "#dc2626" },
        { label: "400", color: "#ea580c" },
        { label: "300", color: "#16a34a" },
      ];

      const segAngle = (Math.PI * 2) / segments.length;
      segments.forEach((seg, i) => {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, wheelRadius - 4, i * segAngle, (i + 1) * segAngle);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();
        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Multiplier Text
        ctx.save();
        ctx.rotate(i * segAngle + segAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px monospace";
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 4;
        ctx.fillText(seg.label, wheelRadius - 16, 4);
        ctx.restore();
      });

      // Wheel Center Medallion
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fillStyle = "#eab308";
      ctx.fill();
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();

      // Wheel Pointer (Lock Pin)
      ctx.beginPath();
      ctx.moveTo(wheelCenterX - 10, wheelCenterY - wheelRadius + 2);
      ctx.lineTo(wheelCenterX + 10, wheelCenterY - wheelRadius + 2);
      ctx.lineTo(wheelCenterX, wheelCenterY - wheelRadius + 18);
      ctx.closePath();
      ctx.fillStyle = "#fef08a";
      ctx.fill();
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 3. Slot Matrix Frame (3 Reels + 1 Special Reel)
      const startX = 14;
      const startY = 175;
      const tileW = 76;
      const tileH = 76;
      const gap = 6;

      // Outer Stone Border
      ctx.fillStyle = "#1e0b02";
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 4;
      ctx.strokeRect(startX - 6, startY - 6, tileW * 4 + gap * 3 + 12, tileH * 3 + gap * 2 + 12);
      ctx.fillRect(startX - 6, startY - 6, tileW * 4 + gap * 3 + 12, tileH * 3 + gap * 2 + 12);

      // Render Reels & Tiles
      state.reels.forEach((reel, col) => {
        const x = startX + col * (tileW + gap);

        // Reel Clip Area to prevent overflow
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, startY, tileW, tileH * 3 + gap * 2);
        ctx.clip();

        // Speed friction update
        if (reel.speed > 0) {
          reel.y += reel.speed;
          if (reel.stopping && reel.speed > 4) {
            reel.speed *= 0.88;
          } else if (reel.stopping && reel.speed <= 4) {
            reel.speed = 0;
            reel.y = 0;
          }
        }

        // Draw 3 Visible Rows
        for (let row = 0; row < 3; row++) {
          const y = startY + row * (tileH + gap);
          const sym = reel.finalSymbols[row];

          // 4th Column is Special Tower
          if (col === 3) {
            ctx.fillStyle = row === 1 ? "#3b1704" : "#190801";
            ctx.fillRect(x, y, tileW, tileH);
            ctx.strokeStyle = row === 1 ? "#facc15" : "#78350f";
            ctx.lineWidth = row === 1 ? 3 : 1;
            ctx.strokeRect(x, y, tileW, tileH);

            // Special Medallion
            const cx = x + tileW / 2;
            const cy = y + tileH / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, 22, 0, Math.PI * 2);
            ctx.fillStyle =
              sym === "WHEEL"
                ? "#dc2626"
                : Number(sym) >= 10
                ? "#9333ea"
                : Number(sym) >= 5
                ? "#0284c7"
                : "#16a34a";
            ctx.fill();
            ctx.strokeStyle = "#fde047";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(sym === "WHEEL" ? "WHEEL" : `${sym}x`, cx, cy);
            continue;
          }

          // Main Slot Tile Background (High-Relief Gold Frame)
          const tileGrad = ctx.createLinearGradient(x, y, x, y + tileH);
          tileGrad.addColorStop(0, "#fde047");
          tileGrad.addColorStop(0.5, "#b45309");
          tileGrad.addColorStop(1, "#381704");
          ctx.fillStyle = tileGrad;
          ctx.fillRect(x, y, tileW, tileH);

          // Inner Bezel
          ctx.fillStyle = "#1f0901";
          ctx.fillRect(x + 4, y + 4, tileW - 8, tileH - 8);

          // Render Authentic Symbols inside Canvas
          const cx = x + tileW / 2;
          const cy = y + tileH / 2;

          if (sym === "garuda") {
            // 3D Golden Garuda Mask
            ctx.fillStyle = "#facc15";
            ctx.beginPath();
            ctx.arc(cx, cy - 4, 18, 0, Math.PI * 2);
            ctx.fill();

            // Crown Rubies
            ctx.fillStyle = "#dc2626";
            ctx.beginPath();
            ctx.arc(cx, cy - 18, 4, 0, Math.PI * 2);
            ctx.arc(cx - 8, cy - 14, 3, 0, Math.PI * 2);
            ctx.arc(cx + 8, cy - 14, 3, 0, Math.PI * 2);
            ctx.fill();

            // Beak & Eyes
            ctx.fillStyle = "#451a03";
            ctx.beginPath();
            ctx.arc(cx - 7, cy - 5, 2.5, 0, Math.PI * 2);
            ctx.arc(cx + 7, cy - 5, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // WILD Banner
            ctx.fillStyle = "#dc2626";
            ctx.fillRect(x + 6, y + tileH - 18, tileW - 12, 12);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 9px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("WILD", cx, y + tileH - 9);
          } else if (sym === "ruby") {
            ctx.beginPath();
            ctx.arc(cx, cy, 18, 0, Math.PI * 2);
            ctx.fillStyle = "#e11d48";
            ctx.fill();
            ctx.strokeStyle = "#fde047";
            ctx.lineWidth = 2.5;
            ctx.stroke();
          } else if (sym === "sapphire") {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = "#2563eb";
            ctx.fillRect(-14, -14, 28, 28);
            ctx.strokeStyle = "#93c5fd";
            ctx.lineWidth = 2;
            ctx.strokeRect(-14, -14, 28, 28);
            ctx.restore();
          } else if (sym === "emerald") {
            ctx.beginPath();
            ctx.rect(cx - 15, cy - 15, 30, 30);
            ctx.fillStyle = "#059669";
            ctx.fill();
            ctx.strokeStyle = "#6ee7b7";
            ctx.lineWidth = 2;
            ctx.stroke();
          } else {
            // A, K, Q, J
            ctx.fillStyle = "#facc15";
            ctx.font = "bold 32px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "#000";
            ctx.shadowBlur = 6;
            ctx.fillText(String(sym), cx, cy);
            ctx.shadowBlur = 0;
          }
        }
        ctx.restore();
      });

      // 4. Center Payline Laser Effect
      if (state.laserActive) {
        const centerY = startY + tileH + gap + tileH / 2;
        ctx.save();
        ctx.strokeStyle = "#fef08a";
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 18;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startX, centerY);
        ctx.lineTo(startX + tileW * 4 + gap * 3, centerY);
        ctx.stroke();
        ctx.restore();
      }

      // 5. Particles Update (Golden Coin Shower)
      state.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.life -= 0.02;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        if (p.life <= 0) state.particles.splice(idx, 1);
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, []);

  // Strong Slot Spin Controller
  const spin = () => {
    if (isSpinning) return;
    if (!user || user.balance < totalBet) {
      toast.error("Balance insufficient!");
      return;
    }

    setIsSpinning(true);
    addScore(-totalBet);
    setWinDisplay(0);

    const state = stateRef.current;
    state.laserActive = false;
    state.bigWinActive = false;
    state.wheelSpeed = 16; // spin top wheel

    // Start all reels rolling with physics velocity
    state.reels.forEach((r, idx) => {
      r.speed = 28 + idx * 4;
      r.stopping = false;
    });

    if (sound) audio.playSpinTick();

    // Staggered sequential reel stopping
    [0, 1, 2, 3].forEach((reelIdx) => {
      setTimeout(() => {
        const reel = state.reels[reelIdx];

        if (reelIdx < 3) {
          reel.finalSymbols = [
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          ];
        } else {
          reel.finalSymbols = [
            MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)],
            MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)],
            MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)],
          ];
        }

        reel.stopping = true;
        if (sound) audio.playReelStop();

        // When 4th reel stops -> Evaluate center row hit
        if (reelIdx === 3) {
          state.wheelSpeed = 0;
          setIsSpinning(false);

          const c0 = state.reels[0].finalSymbols[1];
          const c1 = state.reels[1].finalSymbols[1];
          const c2 = state.reels[2].finalSymbols[1];
          const multi = state.reels[3].finalSymbols[1];

          const isMatch =
            (c0 === c1 || c0 === "garuda" || c1 === "garuda") &&
            (c1 === c2 || c1 === "garuda" || c2 === "garuda");

          if (isMatch) {
            state.laserActive = true;
            const multiNum = typeof multi === "number" ? multi : 20;
            const payout = Math.round(bet * 4 * multiNum);

            addScore(payout);
            setWinDisplay(payout);

            // Trigger Canvas Particle Explosion
            for (let i = 0; i < 60; i++) {
              state.particles.push({
                x: 175,
                y: 250,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.8) * 14,
                life: 1,
                color: i % 2 === 0 ? "#facc15" : "#f59e0b",
              });
            }

            if (sound) audio.playWinFanfare(multiNum >= 10);
            toast.success(`🎉 HIT! +₹${payout} (${multiNum}x Multiplier)`);
          }
        }
      }, 700 + reelIdx * 350);
    });
  };

  return (
    <div className="relative mx-auto max-w-[360px] overflow-hidden rounded-3xl border-4 border-[#78350f] bg-[#0c0401] shadow-2xl select-none font-sans text-white">
      {/* 1win Header */}
      <div className="flex items-center justify-between border-b border-amber-900/60 bg-[#140802] px-3 py-1.5 z-20">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSound(!sound)}
            className="text-amber-400 hover:text-amber-200"
          >
            {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
            JILI Games (Engine 60 FPS)
          </span>
        </div>

        <button
          type="button"
          disabled={isSpinning}
          onClick={() => setExtraBet(!extraBet)}
          className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9.5px] font-black tracking-wider transition-all ${
            extraBet
              ? "bg-gradient-to-r from-yellow-400 to-amber-600 border-yellow-200 text-slate-950 shadow-[0_0_12px_#f59e0b]"
              : "bg-[#240e02] border-amber-800 text-amber-300"
          }`}
        >
          <span className="rounded bg-black/60 px-1 text-[8px] text-yellow-300">EX</span>
          <span>{extraBet ? "ON" : "OFF"}</span>
        </button>
      </div>

      {/* Main 60 FPS Canvas Element */}
      <div className="flex justify-center bg-black">
        <canvas
          ref={canvasRef}
          width={350}
          height={420}
          className="block w-full max-w-[350px]"
        />
      </div>

      {/* Bottom Deck Controls */}
      <div className="border-t-2 border-[#b45309] bg-gradient-to-b from-[#2a1204] to-[#0d0400] p-2.5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-amber-900/60 pb-1.5 px-2">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-xs font-black text-amber-400">WIN</span>
            <span className="font-mono text-sm font-black text-emerald-400">
              ₹{winDisplay > 0 ? winDisplay.toLocaleString("en-IN") : "0.00"}
            </span>
          </div>
          <span className="text-[11px] font-mono text-amber-300 font-bold">
            Balance: <strong className="text-white">₹{user?.balance || 0}</strong>
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSpinning}
              onClick={() => setBet((b) => Math.max(10, b - 10))}
              className="flex size-8 items-center justify-center rounded-full border border-amber-600 bg-[#241004] text-amber-200 active:scale-95 shadow"
            >
              <Minus className="size-4" />
            </button>

            <div className="rounded-xl border border-amber-600 bg-[#0f0501] px-3 py-1 text-center shadow-inner">
              <span className="block text-[8px] uppercase tracking-wider text-amber-400/80 font-bold">
                Bet
              </span>
              <span className="font-mono text-sm font-black text-white">₹{totalBet}</span>
            </div>

            <button
              type="button"
              disabled={isSpinning}
              onClick={() => setBet((b) => b + 10)}
              className="flex size-8 items-center justify-center rounded-full border border-amber-600 bg-[#241004] text-amber-200 active:scale-95 shadow"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <button
            type="button"
            disabled={isSpinning}
            onClick={spin}
            className={`relative flex size-16 items-center justify-center rounded-full border-4 border-[#fef08a] bg-gradient-to-b from-[#fde047] via-[#ca8a04] to-[#713f12] shadow-[0_0_25px_#f59e0b,inset_0_2px_5px_rgba(255,255,255,0.9)] active:scale-90 transition-transform ${
              isSpinning ? "opacity-80 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              <span className="font-display text-[12px] font-black tracking-wider text-[#451a03] drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                SPIN
              </span>
              <span className="font-mono text-[8.5px] font-black text-red-950">
                ₹{totalBet}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReelGame;
