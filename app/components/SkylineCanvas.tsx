"use client";

import { useEffect, useRef } from "react";
import styles from "./SkylineCanvas.module.css";

interface Firefly {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  alpha: number;
  alphaDelta: number;
  color: string;
}

const FIREFLY_COLORS = [
  "rgba(78,161,255,",
  "rgba(79,227,255,",
  "rgba(44,255,183,",
  "rgba(255,200,87,",
];

function seededRand(seed: number) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function drawSkyline(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  rand: () => number
) {
  const GRID = 8;
  const horizonY = Math.floor(H * 0.62);

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, "#020409");
  skyGrad.addColorStop(0.5, "#05070C");
  skyGrad.addColorStop(1, "#070B14");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Stars
  ctx.fillStyle = "rgba(230,240,255,0.9)";
  for (let i = 0; i < 180; i++) {
    const sx = Math.floor(rand() * W);
    const sy = Math.floor(rand() * horizonY * 0.9);
    const sz = rand() > 0.85 ? 2 : 1;
    ctx.fillRect(sx, sy, sz, sz);
  }

  // Moon
  const moonX = Math.floor(W * 0.78);
  const moonY = Math.floor(horizonY * 0.18);
  const moonR = 18;
  ctx.fillStyle = "#E6F0FF";
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#05070C";
  ctx.beginPath();
  ctx.arc(moonX - 6, moonY - 3, moonR - 4, 0, Math.PI * 2);
  ctx.fill();

  // Moon glow
  const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR, moonX, moonY, moonR * 5);
  moonGlow.addColorStop(0, "rgba(78,161,255,0.08)");
  moonGlow.addColorStop(1, "transparent");
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR * 5, 0, Math.PI * 2);
  ctx.fill();

  // Ground
  const groundGrad = ctx.createLinearGradient(0, horizonY, 0, H);
  groundGrad.addColorStop(0, "#0B1220");
  groundGrad.addColorStop(1, "#05070C");
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, horizonY, W, H - horizonY);

  // Horizon glow line
  ctx.strokeStyle = "rgba(78,161,255,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.lineTo(W, horizonY);
  ctx.stroke();

  // Buildings
  const buildingColors = [
    "#0B1220", "#0D1527", "#0F182E",
    "#111B33", "#0A1018",
  ];
  const windowOn  = ["#4EA1FF", "#4FE3FF", "#FFC857", "#2CFFB7"];
  const windowOff = "rgba(30,50,80,0.3)";

  let curX = 0;
  while (curX < W) {
    const bW   = (Math.floor(rand() * 6) + 4) * GRID;
    const bH   = (Math.floor(rand() * 14) + 5) * GRID;
    const bY   = horizonY - bH;
    const bCol = buildingColors[Math.floor(rand() * buildingColors.length)];

    // Building body
    ctx.fillStyle = bCol;
    ctx.fillRect(curX, bY, bW, bH);

    // Pixel outline
    ctx.strokeStyle = "rgba(36,59,102,0.6)";
    ctx.lineWidth = 1;
    ctx.strokeRect(curX, bY, bW, bH);

    // Windows
    const cols = Math.floor(bW / GRID) - 1;
    const rows = Math.floor(bH / GRID) - 1;
    for (let r = 1; r < rows; r++) {
      for (let c = 1; c < cols; c++) {
        const wx = curX + c * GRID - GRID / 2;
        const wy = bY + r * GRID;
        const lit = rand() > 0.55;
        ctx.fillStyle = lit
          ? windowOn[Math.floor(rand() * windowOn.length)]
          : windowOff;
        ctx.fillRect(wx, wy, GRID - 4, GRID - 4);
      }
    }

    // Roof details (antenna / water tower)
    if (rand() > 0.6) {
      ctx.fillStyle = "rgba(78,161,255,0.7)";
      const antennaX = curX + Math.floor(bW / 2);
      ctx.fillRect(antennaX - 1, bY - GRID * 2, 2, GRID * 2);
      // Blink dot at top
      ctx.fillStyle = "#FF4E6A";
      ctx.fillRect(antennaX - 2, bY - GRID * 2 - 2, 4, 4);
    }

    curX += bW + (rand() > 0.7 ? GRID : 0);
  }

  // Reflections
  const reflGrad = ctx.createLinearGradient(0, horizonY, 0, H);
  reflGrad.addColorStop(0, "rgba(78,161,255,0.04)");
  reflGrad.addColorStop(1, "transparent");
  ctx.fillStyle = reflGrad;
  ctx.fillRect(0, horizonY, W, H - horizonY);

  // Road lines
  ctx.strokeStyle = "rgba(78,161,255,0.15)";
  ctx.lineWidth = 1;
  ctx.setLineDash([GRID, GRID * 2]);
  ctx.beginPath();
  ctx.moveTo(0, horizonY + Math.floor((H - horizonY) * 0.5));
  ctx.lineTo(W, horizonY + Math.floor((H - horizonY) * 0.5));
  ctx.stroke();
  ctx.setLineDash([]);
}

export default function SkylineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const firefliesRef = useRef<Firefly[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      const rand = seededRand(42);
      drawSkyline(ctx, canvas.width, canvas.height, rand);
    };

    resize();
    window.addEventListener("resize", resize);

    // Init fireflies
    const count = 60;
    firefliesRef.current = Array.from({ length: count }, (_, i) => {
      const rand = seededRand(i * 999 + 7);
      return {
        x: rand() * window.innerWidth,
        y: rand() * window.innerHeight * 0.65,
        size: rand() > 0.7 ? 3 : 2,
        speedX: (rand() - 0.5) * 0.4,
        speedY: (rand() - 0.5) * 0.2,
        alpha: rand() * 0.6 + 0.2,
        alphaDelta: (rand() - 0.5) * 0.012,
        color: FIREFLY_COLORS[Math.floor(rand() * FIREFLY_COLORS.length)],
      };
    });

    // Animation loop (fireflies only — redraw skyline once)
    const W = canvas.width;
    const H = canvas.height;

    // Offscreen for static skyline
    const offscreen = document.createElement("canvas");
    offscreen.width = W;
    offscreen.height = H;
    const offCtx = offscreen.getContext("2d")!;
    const rand = seededRand(42);
    drawSkyline(offCtx, W, H, rand);

    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(offscreen, 0, 0);

      for (const f of firefliesRef.current) {
        f.x += f.speedX;
        f.y += f.speedY;
        f.alpha += f.alphaDelta;
        if (f.alpha <= 0.1 || f.alpha >= 0.9) f.alphaDelta *= -1;
        if (f.x < 0) f.x = W;
        if (f.x > W) f.x = 0;
        if (f.y < 0) f.y = H * 0.65;
        if (f.y > H * 0.65) f.y = 0;

        ctx.fillStyle = `${f.color}${f.alpha.toFixed(2)})`;
        ctx.fillRect(
          Math.floor(f.x),
          Math.floor(f.y),
          f.size,
          f.size
        );
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={styles.skyline}
      aria-hidden="true"
    />
  );
}
