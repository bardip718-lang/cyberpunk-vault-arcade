import React, { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Minus, Plus } from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";
import { WinCelebration, tierFor, type WinTier } from "@/components/win-celebration";

// Web Audio synthesizer for spins, stops, wins
const playSound = (type: "spin" | "stop" | "win" | "click") => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "spin") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "stop") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === "win") {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.07);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.07);
        osc.stop(ctx.currentTime + i * 0.07 + 0.2);
      });
    } else if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    }
  } catch {}
};

type SymbolType = "garuda" | "ruby" | "sapphire" | "emerald" | "A" | "K" | "Q";

interface SymbolConfig {
  id: SymbolType;
  payout: number;
}

const SYMBOLS: SymbolConfig[] = [
  { id: "garuda", payout: 25 },
  { id: "ruby", payout: 12 },
  { id: "sapphire", payout: 8 },
  { id: "emerald", payout: 5 },
  { id: "A", payout: 2.5 },
  { id: "K", payout: 1.8 },
  { id: "Q", payout: 1.2 },
];

export function ReelGame() {
  const { user, addScore } = useVault();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [bet, setBet] = useState(3);
  const [extraBet, setExtraBet] = useState(false);
  const [sound, setSound] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [winAmount, setWinAmount] = useState(0);

  const [celebration, setCelebration] = useState<{ tier: WinTier; amount: number; key: number } | null>(null);

  // Reel states (3 rows x 4 cols: cols 0..2 are slot symbols, col 3 is multiplier)
  const reelsRef = useRef<{
    cols: SymbolType[][];
    multipliers: (number | string)[];
    offsets: number[];
    speeds: number[];
  }>({
    cols: [
      ["garuda", "ruby", "sapphire"],
      ["ruby", "garuda", "emerald"],
      ["sapphire", "emerald", "A"],
    ],
    multipliers: [5, 10, 15],
    offsets: [0, 0, 0, 0],
    speeds: [0, 0, 0, 0],
  });

  const wheelAngleRef = useRef(0);
  const animIdRef = useRef<number | null>(null);

  const totalBet = extraBet ? Math.round(bet * 1.5) : bet;

  // Custom 2D Graphics Renderers
  const drawGaruda = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.save();
    ctx.translate(x, y);

    // Beveled Gold Frame Tile
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, "#fde047");
    grad.addColorStop(0.5, "#ca8a04");
    grad.addColorStop(1, "#451a03");
    ctx.fillStyle = grad;
    ctx.fillRect(2, 2, size - 4, size - 4);

    ctx.strokeStyle = "#ffe875";
    ctx.lineWidth = 2;
    ctx.strokeRect(3, 3, size - 6, size - 6);

    // Mask Silhouette
    const maskGrad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
    maskGrad.addColorStop(0, "#fef08a");
    maskGrad.addColorStop(0.6, "#d97706");
    maskGrad.addColorStop(1, "#78350f");
    ctx.fillStyle = maskGrad;

    ctx.beginPath();
    ctx.moveTo(size * 0.5, size * 0.12);
    ctx.lineTo(size * 0.85, size * 0.32);
    ctx.lineTo(size * 0.8, size * 0.65);
    ctx.lineTo(size * 0.5, size * 0.82);
    ctx.lineTo(size * 0.2, size * 0.65);
    ctx.lineTo(size * 0.15, size * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Red Gem Crown
    ctx.fillStyle = "#e11d48";
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.22, size * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Piercing Crimson Eyes
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.ellipse(size * 0.36, size * 0.44, size * 0.08, size * 0.05, 0, 0, Math.PI * 2);
    ctx.ellipse(size * 0.64, size * 0.44, size * 0.08, size * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();

    // Golden Beak
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.moveTo(size * 0.5, size * 0.42);
    ctx.lineTo(size * 0.42, size * 0.62);
    ctx.lineTo(size * 0.58, size * 0.62);
    ctx.closePath();
    ctx.fill();

    // WILD Badge Strip
    ctx.fillStyle = "#b91c1c";
    ctx.fillRect(4, size - 14, size - 8, 12);
    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("WILD", size / 2, size - 8);

    ctx.restore();
  };

  const drawRuby = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.save();
    ctx.translate(x, y);

    // Gold Aztec Filigree Plate
    const g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, "#fde047");
    g.addColorStop(0.5, "#a16207");
    g.addColorStop(1, "#290c01");
    ctx.fillStyle = g;
    ctx.fillRect(2, 2, size - 4, size - 4);
    ctx.strokeStyle = "#ca8a04";
    ctx.strokeRect(3, 3, size - 6, size - 6);

    // Concentric Carved Ring
    ctx.fillStyle = "#451a03";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fef08a";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3D Faceted Ruby Gem
    const rubyGrad = ctx.createRadialGradient(size * 0.4, size * 0.4, 2, size / 2, size / 2, size * 0.3);
    rubyGrad.addColorStop(0, "#ffe4e6");
    rubyGrad.addColorStop(0.3, "#f43f5e");
    rubyGrad.addColorStop(0.8, "#be123c");
    rubyGrad.addColorStop(1, "#4c0519");
    ctx.fillStyle = rubyGrad;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Gem Facet Cuts
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1;
    ctx.strokeRect(size * 0.36, size * 0.36, size * 0.28, size * 0.28);

    ctx.restore();
  };

  const drawSapphire = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.save();
    ctx.translate(x, y);

    const g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, "#fde047");
    g.addColorStop(0.5, "#a16207");
    g.addColorStop(1, "#290c01");
    ctx.fillStyle = g;
    ctx.fillRect(2, 2, size - 4, size - 4);

    // Carved Dark Inset
    ctx.fillStyle = "#1e1003";
    ctx.fillRect(size * 0.12, size * 0.12, size * 0.76, size * 0.76);
    ctx.strokeStyle = "#ca8a04";
    ctx.strokeRect(size * 0.12, size * 0.12, size * 0.76, size * 0.76);

    // Octagonal 3D Sapphire
    const sapphGrad = ctx.createRadialGradient(size * 0.4, size * 0.4, 3, size / 2, size / 2, size * 0.32);
    sapphGrad.addColorStop(0, "#dbeafe");
    sapphGrad.addColorStop(0.35, "#3b82f6");
    sapphGrad.addColorStop(0.8, "#1d4ed8");
    sapphGrad.addColorStop(1, "#082f49");
    ctx.fillStyle = sapphGrad;

    const r = size * 0.28;
    const cx = size / 2;
    const cy = size / 2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const px = cx + r * Math.cos(a);
      const py = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#bfdbfe";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();
  };

  const drawEmerald = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.save();
    ctx.translate(x, y);

    const g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, "#fde047");
    g.addColorStop(0.5, "#a16207");
    g.addColorStop(1, "#290c01");
    ctx.fillStyle = g;
    ctx.fillRect(2, 2, size - 4, size - 4);

    // Hexagonal Emerald
    ctx.fillStyle = "#150a01";
    ctx.fillRect(size * 0.12, size * 0.12, size * 0.76, size * 0.76);

    const emGrad = ctx.createRadialGradient(size * 0.4, size * 0.4, 3, size / 2, size / 2, size * 0.32);
    emGrad.addColorStop(0, "#d1fae5");
    emGrad.addColorStop(0.3, "#10b981");
    emGrad.addColorStop(0.75, "#047857");
    emGrad.addColorStop(1, "#022c22");
    ctx.fillStyle = emGrad;

    const r = size * 0.28;
    const cx = size / 2;
    const cy = size / 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const px = cx + r * Math.cos(a);
      const py = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#a7f3d0";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();
  };

  const drawLetter = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, char: string) => {
    ctx.save();
    ctx.translate(x, y);

    // Rustic Wood/Bronze Tile
    const g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, "#78350f");
    g.addColorStop(0.5, "#451a03");
    g.addColorStop(1, "#1c0700");
    ctx.fillStyle = g;
    ctx.fillRect(2, 2, size - 4, size - 4);
    ctx.strokeStyle = "#92400e";
    ctx.strokeRect(3, 3, size - 6, size - 6);

    // Embossed Gold Text
    const textGrad = ctx.createLinearGradient(0, size * 0.2, 0, size * 0.8);
    textGrad.addColorStop(0, "#fffbeb");
    textGrad.addColorStop(0.5, "#facc15");
    textGrad.addColorStop(1, "#ca8a04");
    ctx.fillStyle = textGrad;
    ctx.font = `900 ${Math.round(size * 0.52)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 4;
    ctx.fillText(char, size / 2, size / 2);

    ctx.restore();
  };

  const drawMultiplierMedallion = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    val: number | string,
    isCenter: boolean
  ) => {
    ctx.save();
    ctx.translate(x, y);

    // Center Gold Selection Bracket
    if (isCenter) {
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(1, 1, size - 2, size - 2);
    }

    const num = Number(val);
    const colorGrad = ctx.createLinearGradient(0, 0, 0, size);
    if (num >= 15) {
      colorGrad.addColorStop(0, "#f87171");
      colorGrad.addColorStop(1, "#7f1d1d");
    } else if (num >= 10) {
      colorGrad.addColorStop(0, "#c084fc");
      colorGrad.addColorStop(1, "#581c87");
    } else {
      colorGrad.addColorStop(0, "#60a5fa");
      colorGrad.addColorStop(1, "#1e3a8a");
    }

    // Outer Star Lotus
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fef08a";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner Disc
    ctx.fillStyle = colorGrad;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.32, 0, Math.PI * 2);
    ctx.fill();

    // Text Multiplier
    ctx.fillStyle = "#fffbeb";
    ctx.font = `900 ${Math.round(size * 0.3)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${val}x`, size / 2, size / 2);

    ctx.restore();
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Ancient Stone Temple Background
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#2c1304");
      bg.addColorStop(0.5, "#140701");
      bg.addColorStop(1, "#070200");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // 2. Top Semi-Circular Lucky Wheel
      const wheelCenterX = w / 2;
      const wheelCenterY = 110;
      const wheelRadius = 88;

      ctx.save();
      ctx.translate(wheelCenterX, wheelCenterY);
      ctx.rotate(wheelAngleRef.current);

      const slices = [
        { label: "150", color: "#0284c7" },
        { label: "90", color: "#16a34a" },
        { label: "300", color: "#ca8a04" },
        { label: "45", color: "#9333ea" },
        { label: "500", color: "#dc2626" },
        { label: "20", color: "#0d9488" },
      ];
      const sliceAngle = (Math.PI * 2) / slices.length;

      slices.forEach((s, idx) => {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, wheelRadius, idx * sliceAngle, (idx + 1) * sliceAngle);
        ctx.closePath();
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.rotate(idx * sliceAngle + sliceAngle / 2);
        ctx.fillStyle = "#fffbeb";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(s.label, wheelRadius - 12, 5);
        ctx.restore();
      });

      // Gold Outer Rim
      ctx.beginPath();
      ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.restore();

      // Wheel Arrow Pointer & Hub
      ctx.fillStyle = "#ca8a04";
      ctx.beginPath();
      ctx.arc(wheelCenterX, wheelCenterY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fef08a";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.moveTo(wheelCenterX - 6, wheelCenterY - 20);
      ctx.lineTo(wheelCenterX + 6, wheelCenterY - 20);
      ctx.lineTo(wheelCenterX, wheelCenterY - 32);
      ctx.closePath();
      ctx.fill();

      // Title Banner Under Wheel
      ctx.fillStyle = "#facc15";
      ctx.font = "italic 900 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("FORTUNE GEMS 2", w / 2, 138);

      // 3. Slot Matrix Frame (3x3 + 1 Special Reel)
      const startX = 14;
      const startY = 152;
      const tileSize = 66;
      const gap = 4;

      // Outer Carved Stone Frame
      ctx.fillStyle = "#3d1804";
      ctx.fillRect(startX - 6, startY - 6, tileSize * 4 + gap * 3 + 12, tileSize * 3 + gap * 2 + 12);
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 3;
      ctx.strokeRect(startX - 6, startY - 6, tileSize * 4 + gap * 3 + 12, tileSize * 3 + gap * 2 + 12);

      // Columns 0..2 (Slot Symbols)
      for (let c = 0; c < 3; c++) {
        for (let r = 0; r < 3; r++) {
          const px = startX + c * (tileSize + gap);
          const py = startY + r * (tileSize + gap);
          const sym = reelsRef.current.cols[c][r];

          if (sym === "garuda") drawGaruda(ctx, px, py, tileSize);
          else if (sym === "ruby") drawRuby(ctx, px, py, tileSize);
          else if (sym === "sapphire") drawSapphire(ctx, px, py, tileSize);
          else if (sym === "emerald") drawEmerald(ctx, px, py, tileSize);
          else drawLetter(ctx, px, py, tileSize, sym);
        }
      }

      // Column 3: Special Wheel Multiplier Reel
      const specX = startX + 3 * (tileSize + gap);
      ctx.fillStyle = "#1e0b02";
      ctx.fillRect(specX, startY, tileSize, tileSize * 3 + gap * 2);
      ctx.strokeStyle = "#ca8a04";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(specX, startY, tileSize, tileSize * 3 + gap * 2);

      for (let r = 0; r < 3; r++) {
        const py = startY + r * (tileSize + gap);
        drawMultiplierMedallion(ctx, specX, py, tileSize, reelsRef.current.multipliers[r], r === 1);
      }

      // Center Laser Payline Beam
      const centerY = startY + tileSize + gap / 2 + tileSize / 2;
      const beamGrad = ctx.createLinearGradient(startX, 0, startX + tileSize * 4 + gap * 3, 0);
      beamGrad.addColorStop(0, "rgba(250,204,21,0.0)");
      beamGrad.addColorStop(0.5, "rgba(250,204,21,0.9)");
      beamGrad.addColorStop(1, "rgba(250,204,21,0.0)");
      ctx.strokeStyle = beamGrad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX, centerY);
      ctx.lineTo(startX + tileSize * 4 + gap * 3, centerY);
      ctx.stroke();

      animIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, []);

  const getRandomSymbol = (): SymbolType => {
    const r = Math.random();
    if (r < 0.12) return "garuda";
    if (r < 0.28) return "ruby";
    if (r < 0.48) return "sapphire";
    if (r < 0.68) return "emerald";
    if (r < 0.82) return "A";
    if (r < 0.92) return "K";
    return "Q";
  };

  const handleBetChange = (delta: number) => {
    if (spinning) return;
    if (sound) playSound("click");
    const bets = [1, 2, 3, 5, 10, 25, 50, 100];
    const idx = bets.indexOf(bet);
    const nextIdx = Math.max(0, Math.min(bets.length - 1, idx + delta));
    setBet(bets[nextIdx]);
  };

  const handleSpin = () => {
    if (spinning) return;
    if (!user || user.balance < totalBet) {
      toast.error("Insufficient balance! Please deposit to play.");
      return;
    }

    setSpinning(true);
    addScore(-totalBet);
    setWinAmount(0);
    setCelebration(null);
    if (sound) playSound("spin");

    const multiPool = extraBet ? [2, 3, 5, 10, 15] : [1, 2, 3, 5, 10, 15];
    let ticks = 0;

    const interval = setInterval(() => {
      ticks++;
      wheelAngleRef.current += 0.25;

      // Randomize during spin animation
      reelsRef.current.cols = [
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      ];
      reelsRef.current.multipliers = [
        multiPool[Math.floor(Math.random() * multiPool.length)],
        multiPool[Math.floor(Math.random() * multiPool.length)],
        multiPool[Math.floor(Math.random() * multiPool.length)],
      ];

      if (sound && ticks % 2 === 0) playSound("spin");

      if (ticks > 18) {
        clearInterval(interval);
        if (sound) playSound("stop");

        // Land Final Results
        const finalCols: SymbolType[][] = [
          [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
          [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
          [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        ];

        const finalMultipliers = [
          multiPool[Math.floor(Math.random() * multiPool.length)],
          multiPool[Math.floor(Math.random() * multiPool.length)],
          multiPool[Math.floor(Math.random() * multiPool.length)],
        ];

        reelsRef.current.cols = finalCols;
        reelsRef.current.multipliers = finalMultipliers;
        setSpinning(false);

        // Center line evaluation (Middle Row)
        const centerMulti = Number(finalMultipliers[1]);
        const s0 = finalCols[0][1];
        const s1 = finalCols[1][1];
        const s2 = finalCols[2][1];

        const isMatch =
          (s0 === s1 || s0 === "garuda" || s1 === "garuda") &&
          (s1 === s2 || s1 === "garuda" || s2 === "garuda");

        if (isMatch) {
          const matchId = [s0, s1, s2].find((x) => x !== "garuda") || "garuda";
          const cfg = SYMBOLS.find((s) => s.id === matchId) || SYMBOLS[0];
          const payout = Math.round(bet * (cfg.payout / 2) * centerMulti);

          addScore(payout);
          setWinAmount(payout);

          const tier = tierFor(centerMulti);
          setCelebration({ tier, amount: payout, key: Date.now() });
          if (sound) playSound("win");
          toast.success(`🎉 Aztec Win! +₹${payout} (${centerMulti}x Multiplier)`);
        }
      }
    }, 70);
  };

  return (
    <div className="relative mx-auto max-w-sm overflow-hidden rounded-3xl border-2 border-amber-800 bg-[#0d0401] p-2 shadow-2xl font-sans select-none text-slate-100">
      
      <WinCelebration
        key={celebration?.key ?? "idle"}
        active={!!celebration}
        tier={celebration?.tier ?? "nice"}
        amount={celebration?.amount ?? 0}
        onDone={() => setCelebration(null)}
      />

      {/* Top Controls: EX Extra Bet + Audio */}
      <div className="flex items-center justify-between border-b border-amber-900/60 pb-1.5 px-2">
        <button
          type="button"
          onClick={() => setSound(!sound)}
          className="rounded p-1 text-amber-400 hover:text-amber-200"
        >
          {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </button>

        <button
          type="button"
          disabled={spinning}
          onClick={() => setExtraBet(!extraBet)}
          className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black transition-all ${
            extraBet
              ? "bg-gradient-to-r from-yellow-400 to-amber-600 border-yellow-200 text-slate-950 shadow-[0_0_12px_#f59e0b]"
              : "bg-[#200a02] border-amber-800 text-amber-300"
          }`}
        >
          <span className="rounded bg-black/60 px-1 text-[8px] text-yellow-300">EX</span>
          <span>{extraBet ? "ON (+50%)" : "OFF"}</span>
        </button>
      </div>

      {/* 100% Client-Side High-Res HTML5 Canvas Viewport */}
      <div className="mt-1 flex justify-center overflow-hidden rounded-2xl border border-amber-900/80 bg-black shadow-inner">
        <canvas
          ref={canvasRef}
          width={310}
          height={380}
          className="w-full max-w-[310px] select-none block"
        />
      </div>

      {/* JILI Authentic Console Deck */}
      <div className="mt-2 rounded-2xl border border-amber-800/80 bg-gradient-to-b from-[#240c02] to-[#0a0300] p-2 shadow-xl">
        <div className="flex items-center justify-between border-b border-amber-900/60 pb-1 px-2">
          <div className="flex items-center gap-1 text-xs font-black">
            <span className="text-amber-400">WIN</span>
            <span className="font-mono text-emerald-400">
              ₹{winAmount > 0 ? winAmount.toLocaleString("en-IN") : "0.00"}
            </span>
          </div>
          <span className="text-[11px] font-mono text-amber-300">
            Bal: <strong className="text-white">₹{user?.balance || 0}</strong>
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between px-2">
          {/* Bet Increment / Decrement */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={spinning}
              onClick={() => handleBetChange(-1)}
              className="flex size-8 items-center justify-center rounded-full border border-amber-600 bg-[#1e0a02] text-amber-200 active:scale-95"
            >
              <Minus className="size-4" />
            </button>

            <div className="rounded-xl border border-amber-700 bg-black/60 px-3 py-1 text-center">
              <span className="block text-[8px] uppercase tracking-wider text-amber-400/80 font-bold">
                Bet
              </span>
              <span className="font-mono text-xs font-black text-white">₹{totalBet}</span>
            </div>

            <button
              type="button"
              disabled={spinning}
              onClick={() => handleBetChange(1)}
              className="flex size-8 items-center justify-center rounded-full border border-amber-600 bg-[#1e0a02] text-amber-200 active:scale-95"
            >
              <Plus className="size-4" />
            </button>
          </div>

          {/* Heavy 3D Golden Medallion Spin Button */}
          <button
            type="button"
            disabled={spinning}
            onClick={handleSpin}
            className={`relative flex size-14 items-center justify-center rounded-full border-4 border-[#fef08a] bg-gradient-to-b from-[#fde047] via-[#ca8a04] to-[#713f12] shadow-[0_0_20px_#f59e0b,inset_0_2px_4px_rgba(255,255,255,0.8)] active:scale-90 transition-transform ${
              spinning ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              <span className="font-display text-[11px] font-black tracking-wider text-[#451a03] drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                SPIN
              </span>
              <span className="font-mono text-[8px] font-black text-red-950">
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
