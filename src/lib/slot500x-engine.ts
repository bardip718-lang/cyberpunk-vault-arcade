import type { SlotSymbol } from "@/lib/slot-engine";

export interface Slot500xResult {
  total: number;
  cells: string[];
  stake: number;
}

interface EngineCallbacks {
  onReelStop: (column: number) => void;
  onComplete: () => void;
}

type AssetName = "garuda" | "ruby" | "emerald" | "sapphire" | "diamond" | "bonus";
type ParticleKind = "spark" | "coin";

interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  spin: number;
}

interface Layout {
  x: number;
  y: number;
  cellWidth: number;
  cellHeight: number;
  gap: number;
}

const ASSETS: AssetName[] = ["garuda", "ruby", "emerald", "sapphire", "diamond", "bonus"];
const SYMBOL_ASSET: Record<SlotSymbol, AssetName> = {
  wild: "garuda",
  ruby: "ruby",
  emerald: "emerald",
  sapphire: "sapphire",
  A: "diamond",
  K: "bonus",
  Q: "bonus",
};
const SYMBOLS: SlotSymbol[] = ["wild", "ruby", "emerald", "sapphire", "A", "K", "Q"];

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function copyGrid(grid: SlotSymbol[][]): SlotSymbol[][] {
  return grid.map((column) => [...column]);
}

/** Canvas presentation only. React supplies and settles every actual demo result. */
export class Slot500xEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly callbacks: EngineCallbacks;
  private readonly images = new Map<AssetName, HTMLImageElement>();
  private readonly palette: {
    ink: string;
    deep: string;
    reel: string;
    gold: string;
    goldLight: string;
    violet: string;
    ember: string;
    text: string;
  };
  private readonly embers = Array.from({ length: 22 }, (_, index) => ({
    seed: ((index * 47 + 19) % 101) / 101,
    depth: 0.45 + ((index * 29) % 60) / 100,
  }));

  private resizeObserver: ResizeObserver | null = null;
  private raf = 0;
  private lastFrame = 0;
  private destroyed = false;
  private width = 1;
  private height = 1;
  private dpr = 1;
  private reducedMotion = false;

  private grid: SlotSymbol[][] = [];
  private targetGrid: SlotSymbol[][] = [];
  private strips: SlotSymbol[][] = [];
  private positions = [0, 0, 0, 0, 0];
  private durations = [0, 0, 0, 0, 0];
  private stopped = [true, true, true, true, true];
  private spinning = false;
  private completed = true;
  private spinStartedAt = 0;
  private result: Slot500xResult = { total: 0, cells: [], stake: 0 };
  private winningCells = new Set<string>();
  private celebrationStartedAt = 0;
  private particles: Particle[] = [];

  constructor(canvas: HTMLCanvasElement, initialGrid: SlotSymbol[][], callbacks: EngineCallbacks) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D is not available in this browser.");
    this.canvas = canvas;
    this.ctx = context;
    this.callbacks = callbacks;
    this.grid = copyGrid(initialGrid);
    this.targetGrid = copyGrid(initialGrid);

    const styles = getComputedStyle(canvas);
    const token = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
    this.palette = {
      ink: token("--slot500x-ink", "#08060d"),
      deep: token("--slot500x-deep", "#120d1c"),
      reel: token("--slot500x-reel", "#181022"),
      gold: token("--slot500x-gold", "#d7a83e"),
      goldLight: token("--slot500x-gold-light", "#ffe5a0"),
      violet: token("--slot500x-violet", "#9b5de5"),
      ember: token("--slot500x-ember", "#ffb547"),
      text: token("--slot500x-text", "#fff7df"),
    };

    this.resize();
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(canvas);
    }
    this.raf = requestAnimationFrame(this.frame);
  }

  async loadAssets() {
    await Promise.all(
      ASSETS.map(
        (name) =>
          new Promise<void>((resolve) => {
            const image = new Image();
            image.decoding = "async";
            image.onload = () => {
              if (!this.destroyed) this.images.set(name, image);
              resolve();
            };
            image.onerror = () => resolve();
            image.src = `/assets/500x/${name}.svg`;
          }),
      ),
    );
  }

  setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced;
  }

  start(grid: SlotSymbol[][], result: Slot500xResult) {
    if (this.destroyed || this.spinning || grid.length !== 5 || grid.some((column) => column.length !== 3)) return false;

    this.targetGrid = copyGrid(grid);
    this.result = { ...result, cells: [...result.cells] };
    this.winningCells.clear();
    this.particles = [];
    this.celebrationStartedAt = 0;
    this.completed = false;
    this.spinning = true;
    this.spinStartedAt = performance.now();
    this.stopped = [false, false, false, false, false];
    this.positions = [0, 0, 0, 0, 0];
    this.durations = this.targetGrid.map((_, column) =>
      this.reducedMotion ? 70 + column * 35 : 900 + column * 210,
    );
    this.strips = this.targetGrid.map((target, column) => {
      const current = this.grid[column] ?? target;
      const fillerCount = this.reducedMotion ? column : 16 + column * 3;
      const filler = Array.from({ length: fillerCount }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] ?? "Q");
      return [...current, ...filler, ...target];
    });
    return true;
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.images.clear();
    this.particles = [];
  }

  private resize() {
    if (this.destroyed) return;
    const bounds = this.canvas.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) return;
    this.width = bounds.width;
    this.height = bounds.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(this.width * this.dpr);
    const pixelHeight = Math.round(this.height * this.dpr);
    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }
  }

  private frame = (now: number) => {
    if (this.destroyed) return;
    const delta = Math.min(40, this.lastFrame ? now - this.lastFrame : 16.67);
    this.lastFrame = now;
    if (this.spinning) this.updateSpin(now);
    this.draw(now, delta);
    this.raf = requestAnimationFrame(this.frame);
  };

  private updateSpin(now: number) {
    const elapsed = now - this.spinStartedAt;
    let allStopped = true;

    for (let column = 0; column < 5; column += 1) {
      const duration = this.durations[column] ?? 0;
      const strip = this.strips[column] ?? [];
      const finalPosition = Math.max(0, strip.length - 3);
      if (elapsed < duration) {
        allStopped = false;
        this.positions[column] = this.travelPosition(elapsed, duration, finalPosition);
      } else {
        this.positions[column] = finalPosition;
        if (!this.stopped[column]) {
          this.stopped[column] = true;
          this.callbacks.onReelStop(column);
        }
      }
    }

    const finalStop = Math.max(...this.durations);
    if (allStopped && !this.completed && elapsed >= finalStop + (this.reducedMotion ? 0 : 150)) {
      this.completed = true;
      this.spinning = false;
      this.grid = copyGrid(this.targetGrid);
      this.winningCells = new Set(this.result.cells);
      this.celebrationStartedAt = now;
      this.spawnCelebration();
      this.callbacks.onComplete();
    }
  }

  private travelPosition(elapsed: number, duration: number, distance: number) {
    if (this.reducedMotion || duration <= 0) return distance * Math.min(1, elapsed / Math.max(1, duration));
    const acceleration = duration * 0.2;
    const deceleration = duration * 0.32;
    const cruise = duration - acceleration - deceleration;
    const velocity = distance / (cruise + acceleration / 2 + deceleration / 2);
    if (elapsed < acceleration) return (velocity * elapsed * elapsed) / (2 * acceleration);
    if (elapsed < acceleration + cruise) {
      return (velocity * acceleration) / 2 + velocity * (elapsed - acceleration);
    }
    const remaining = Math.max(0, duration - elapsed);
    return distance - (velocity * remaining * remaining) / (2 * deceleration);
  }

  private layout(): Layout {
    const outer = Math.max(9, this.width * 0.026);
    const gap = Math.max(3, this.width * 0.008);
    const innerWidth = this.width - outer * 4;
    const innerHeight = this.height - outer * 4;
    return {
      x: outer * 2,
      y: outer * 2,
      cellWidth: (innerWidth - gap * 4) / 5,
      cellHeight: (innerHeight - gap * 2) / 3,
      gap,
    };
  }

  private draw(now: number, delta: number) {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawAtmosphere(now);
    this.drawFrame();
    this.drawReels(now);
    if (this.winningCells.size) this.drawPaylines(now);
    this.drawParticles(delta);
  }

  private drawAtmosphere(now: number) {
    const ctx = this.ctx;
    const background = ctx.createLinearGradient(0, 0, 0, this.height);
    background.addColorStop(0, this.palette.deep);
    background.addColorStop(1, this.palette.ink);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, this.width, this.height);

    if (!this.reducedMotion) {
      ctx.save();
      ctx.globalAlpha = 0.045 + Math.sin(now / 1400) * 0.012;
      ctx.fillStyle = this.palette.goldLight;
      for (let ray = 0; ray < 5; ray += 1) {
        const origin = this.width * (0.2 + ray * 0.15);
        ctx.beginPath();
        ctx.moveTo(origin, 0);
        ctx.lineTo(origin - this.width * 0.16, this.height);
        ctx.lineTo(origin + this.width * 0.06, this.height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.fillStyle = this.palette.ember;
      for (const ember of this.embers) {
        const travel = (now * 0.012 * ember.depth + ember.seed * this.height) % (this.height + 30);
        const x = ember.seed * this.width + Math.sin(now / 900 + ember.seed * 12) * 12;
        const y = this.height + 10 - travel;
        ctx.globalAlpha = 0.12 + ember.depth * 0.25;
        ctx.beginPath();
        ctx.arc(x, y, 0.7 + ember.depth, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawFrame() {
    const ctx = this.ctx;
    const outer = Math.max(9, this.width * 0.026);
    const metal = ctx.createLinearGradient(0, outer, this.width, this.height - outer);
    metal.addColorStop(0, this.palette.goldLight);
    metal.addColorStop(0.45, this.palette.gold);
    metal.addColorStop(1, this.palette.goldLight);

    ctx.save();
    ctx.shadowColor = this.palette.gold;
    ctx.shadowBlur = 14;
    roundedRect(ctx, outer, outer, this.width - outer * 2, this.height - outer * 2, outer * 0.8);
    ctx.fillStyle = this.palette.reel;
    ctx.fill();
    ctx.lineWidth = Math.max(2, outer * 0.2);
    ctx.strokeStyle = metal;
    ctx.stroke();
    ctx.shadowBlur = 0;
    roundedRect(ctx, outer * 1.55, outer * 1.55, this.width - outer * 3.1, this.height - outer * 3.1, outer * 0.45);
    ctx.globalAlpha = 0.65;
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.palette.violet;
    ctx.stroke();
    ctx.restore();
  }

  private drawReels(now: number) {
    const ctx = this.ctx;
    const layout = this.layout();
    const elapsed = now - this.spinStartedAt;

    for (let column = 0; column < 5; column += 1) {
      const x = layout.x + column * (layout.cellWidth + layout.gap);
      const columnHeight = layout.cellHeight * 3 + layout.gap * 2;
      ctx.save();
      roundedRect(ctx, x, layout.y, layout.cellWidth, columnHeight, Math.max(4, layout.cellWidth * 0.07));
      ctx.clip();
      ctx.fillStyle = this.palette.ink;
      ctx.fillRect(x, layout.y, layout.cellWidth, columnHeight);

      const stopped = this.stopped[column] && !this.spinning ? true : (this.stopped[column] ?? false);
      if (stopped) {
        const sinceStop = elapsed - (this.durations[column] ?? 0);
        const bounce = !this.reducedMotion && sinceStop >= 0 && sinceStop < 150
          ? Math.sin((sinceStop / 150) * Math.PI) * layout.cellHeight * 0.075
          : 0;
        const symbols = this.targetGrid[column] ?? this.grid[column] ?? [];
        symbols.forEach((symbol, row) => {
          const y = layout.y + row * (layout.cellHeight + layout.gap) + bounce;
          this.drawSymbol(symbol, column, row, x, y, layout, 1, now);
        });
      } else {
        const strip = this.strips[column] ?? [];
        const position = this.positions[column] ?? 0;
        const whole = Math.floor(position);
        const fraction = position - whole;
        for (let row = -1; row <= 3; row += 1) {
          const symbol = strip[whole + row];
          if (!symbol) continue;
          const y = layout.y + (row - fraction) * (layout.cellHeight + layout.gap);
          if (!this.reducedMotion) {
            this.drawSymbol(symbol, column, row, x, y + 7, layout, 0.12, now);
            this.drawSymbol(symbol, column, row, x, y - 5, layout, 0.09, now);
          }
          this.drawSymbol(symbol, column, row, x, y, layout, 1, now);
        }
      }
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = this.palette.gold;
      ctx.lineWidth = 1;
      roundedRect(ctx, x, layout.y, layout.cellWidth, columnHeight, Math.max(4, layout.cellWidth * 0.07));
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawSymbol(
    symbol: SlotSymbol,
    column: number,
    row: number,
    x: number,
    y: number,
    layout: Layout,
    alpha: number,
    now: number,
  ) {
    const ctx = this.ctx;
    const centerX = x + layout.cellWidth / 2;
    const centerY = y + layout.cellHeight / 2;
    const size = Math.min(layout.cellWidth, layout.cellHeight) * 0.82;
    const image = this.images.get(SYMBOL_ASSET[symbol]);
    const isWinner = this.winningCells.has(`${column}-${row}`);
    const isStopped = this.stopped[column] ?? false;

    ctx.save();
    ctx.globalAlpha = alpha;
    if (isWinner) {
      ctx.shadowColor = this.palette.goldLight;
      ctx.shadowBlur = 12 + Math.sin(now / 120) * 5;
    }
    if (image?.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, centerX - size / 2, centerY - size / 2, size, size);
    } else {
      ctx.fillStyle = symbol === "wild" ? this.palette.gold : this.palette.violet;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    if (symbol === "A" || symbol === "K" || symbol === "Q") {
      ctx.fillStyle = this.palette.text;
      ctx.font = `800 ${Math.max(15, layout.cellHeight * 0.34)}px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = this.palette.ink;
      ctx.shadowBlur = 5;
      ctx.fillText(symbol, centerX, centerY + 1);
      ctx.shadowBlur = 0;
    }

    if (symbol === "wild") {
      ctx.fillStyle = this.palette.goldLight;
      ctx.font = `900 ${Math.max(7, layout.cellHeight * 0.1)}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("WILD", centerX, y + layout.cellHeight * 0.91);
      if (isStopped && !this.reducedMotion) {
        ctx.globalAlpha = alpha * (0.42 + Math.sin(now / 260 + column) * 0.16);
        ctx.strokeStyle = this.palette.goldLight;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.46, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (isWinner) {
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = this.palette.goldLight;
      ctx.lineWidth = 2;
      roundedRect(ctx, x + 2, y + 2, layout.cellWidth - 4, layout.cellHeight - 4, 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawPaylines(now: number) {
    const ctx = this.ctx;
    const layout = this.layout();
    const rows = [...new Set([...this.winningCells].map((cell) => Number(cell.split("-")[1])))];
    ctx.save();
    ctx.strokeStyle = this.palette.goldLight;
    ctx.lineWidth = Math.max(1.5, this.width * 0.004);
    ctx.globalAlpha = 0.55 + Math.sin(now / 150) * 0.2;
    ctx.shadowColor = this.palette.gold;
    ctx.shadowBlur = 10;
    for (const row of rows) {
      const columns = [...this.winningCells]
        .filter((cell) => Number(cell.split("-")[1]) === row)
        .map((cell) => Number(cell.split("-")[0]))
        .sort((a, b) => a - b);
      if (!columns.length) continue;
      ctx.beginPath();
      columns.forEach((column, index) => {
        const x = layout.x + column * (layout.cellWidth + layout.gap) + layout.cellWidth / 2;
        const y = layout.y + row * (layout.cellHeight + layout.gap) + layout.cellHeight / 2;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    ctx.restore();
  }

  private spawnCelebration() {
    if (this.reducedMotion || this.result.total <= 0) return;
    const layout = this.layout();
    const winning = [...this.winningCells].slice(0, 15);
    for (const cell of winning) {
      const [column = 0, row = 0] = cell.split("-").map(Number);
      const x = layout.x + column * (layout.cellWidth + layout.gap) + layout.cellWidth / 2;
      const y = layout.y + row * (layout.cellHeight + layout.gap) + layout.cellHeight / 2;
      for (let index = 0; index < 4; index += 1) {
        this.particles.push({
          kind: "spark",
          x,
          y,
          vx: (Math.random() - 0.5) * 150,
          vy: (Math.random() - 0.75) * 150,
          life: 650 + Math.random() * 450,
          size: 1 + Math.random() * 2,
          spin: 0,
        });
      }
    }

    const bigWin = this.result.total >= this.result.stake * 8;
    const coinCount = bigWin ? 64 : 14;
    for (let index = 0; index < coinCount; index += 1) {
      this.particles.push({
        kind: "coin",
        x: Math.random() * this.width,
        y: -Math.random() * this.height * 0.55,
        vx: (Math.random() - 0.5) * 45,
        vy: 80 + Math.random() * 130,
        life: 2400 + Math.random() * 1200,
        size: 3 + Math.random() * 5,
        spin: Math.random() * Math.PI,
      });
    }
  }

  private drawParticles(delta: number) {
    const ctx = this.ctx;
    const seconds = delta / 1000;
    const next: Particle[] = [];
    for (const particle of this.particles) {
      particle.life -= delta;
      particle.x += particle.vx * seconds;
      particle.y += particle.vy * seconds;
      particle.vy += (particle.kind === "coin" ? 75 : 180) * seconds;
      particle.spin += seconds * 7;
      if (particle.life <= 0 || particle.y > this.height + 30) continue;
      next.push(particle);

      ctx.save();
      ctx.globalAlpha = Math.min(1, particle.life / 350);
      ctx.fillStyle = particle.kind === "coin" ? this.palette.gold : this.palette.goldLight;
      ctx.shadowColor = this.palette.gold;
      ctx.shadowBlur = particle.kind === "coin" ? 5 : 8;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.spin);
      ctx.beginPath();
      ctx.ellipse(0, 0, particle.size, particle.kind === "coin" ? particle.size * 0.55 : particle.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    this.particles = next;
  }
}
