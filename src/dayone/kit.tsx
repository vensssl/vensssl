import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import React from "react";
import timing from "../../public/dayone/timing.json";

export const C = {
  bg: "#07080C",
  ink: "#F4F3EE",
  dim: "#8A8D99",
  line: "#2B2E38",
  gold: "#FFD54A",
  red: "#FF4D6D",
  blue: "#4FC3FF",
  pink: "#FF3D9A",
};
export const FONT = "Montserrat, sans-serif";
export const FPS = 30;

export const T = timing as unknown as {
  lines: Record<string, [number, number]>;
  events: { spotA: number; spotB: number; roll30: [number, number]; roll100: [number, number]; impact: number; stairs: number };
  endCardStart: number;
  duration: number;
};
export const L = (id: string) => T.lines[id][0];
export const LE = (id: string) => T.lines[id][1];

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ramp = (t: number, t0: number, t1: number) => clamp((t - t0) / (t1 - t0));
export const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeIO = (x: number) => {
  const c = clamp(x);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
/** overshoot ease for things that land */
export const back = (x: number) => {
  const c = clamp(x), k = 1.9;
  return 1 + (k + 1) * Math.pow(c - 1, 3) + k * Math.pow(c - 1, 2);
};
export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
/** a light that stutters on: 0 before t0, flickers, then 1 */
export const flickerOn = (t: number, t0: number) => {
  const d = t - t0;
  if (d < 0) return 0;
  if (d < 0.05) return 1;
  if (d < 0.11) return 0.15;
  if (d < 0.16) return 0.8;
  if (d < 0.21) return 0.3;
  return ease(ramp(d, 0.21, 0.35));
};
export const flickerOff = (t: number, t0: number) => (t < t0 ? 1 : 1 - flickerOn(t, t0));

export const neon = (color: string, k = 1) =>
  `drop-shadow(0 0 ${4 * k}px ${color}) drop-shadow(0 0 ${14 * k}px ${color}aa) drop-shadow(0 0 ${30 * k}px ${color}55)`;

/** Shared SVG defs: cone gradients, floor pools, blur. */
export const Defs: React.FC = () => (
  <defs>
    <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#fff" stopOpacity={0.34} />
      <stop offset="0.55" stopColor="#fff" stopOpacity={0.13} />
      <stop offset="1" stopColor="#fff" stopOpacity={0.07} />
    </linearGradient>
    <radialGradient id="pool">
      <stop offset="0" stopColor="#fff" stopOpacity={0.32} />
      <stop offset="0.6" stopColor="#fff" stopOpacity={0.08} />
      <stop offset="1" stopColor="#fff" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="phoneGlow">
      <stop offset="0" stopColor={C.blue} stopOpacity={0.55} />
      <stop offset="1" stopColor={C.blue} stopOpacity={0} />
    </radialGradient>
    <radialGradient id="goldGlow">
      <stop offset="0" stopColor={C.gold} stopOpacity={0.45} />
      <stop offset="1" stopColor={C.gold} stopOpacity={0} />
    </radialGradient>
    <filter id="soft" x="-50%" y="-10%" width="200%" height="120%">
      <feGaussianBlur stdDeviation="9" />
    </filter>
    <linearGradient id="floorFade" x1="0" x2="1">
      <stop offset="0" stopColor="#fff" stopOpacity={0} />
      <stop offset="0.2" stopColor="#fff" stopOpacity={0.22} />
      <stop offset="0.8" stopColor="#fff" stopOpacity={0.22} />
      <stop offset="1" stopColor="#fff" stopOpacity={0} />
    </linearGradient>
  </defs>
);

export const Spotlight: React.FC<{ x: number; floor: number; on: number; top?: number; spread?: number }> = ({ x, floor, on, top = 150, spread = 190 }) => (
  <g opacity={on}>
    <polygon points={`${x - 34},${top} ${x + 34},${top} ${x + spread},${floor} ${x - spread},${floor}`} fill="url(#cone)" filter="url(#soft)" />
    <ellipse cx={x} cy={floor + 4} rx={spread + 30} ry={30} fill="url(#pool)" />
    {/* lamp head */}
    <path d={`M ${x - 46} ${top} L ${x - 30} ${top - 34} L ${x + 30} ${top - 34} L ${x + 46} ${top} Z`} fill="#1c1e25" />
    <rect x={x - 46} y={top - 3} width={92} height={6} rx={3} fill="#fff" style={{ filter: neon("#ffffff", 0.8) }} />
  </g>
);

export type Prop = "phone" | "book" | null;

/**
 * A soft, glowing pawn-like figure (head + bell body + one arm).
 * (x, y) is the point between the feet. arm: degrees, 0 = hanging down.
 */
export const Figure: React.FC<{
  x: number; y: number; s?: number; t: number; seed?: number; arm?: number; prop?: Prop; propOn?: number;
  color?: string; glow?: number; opacity?: number; lean?: number; squash?: number;
}> = ({ x, y, s = 1, t, seed = 0, arm = 0, prop = null, propOn = 1, color = C.ink, glow = 1, opacity = 1, lean = 0, squash = 0 }) => {
  const breath = Math.sin(t * 2.1 + seed) * 0.012;
  const sy = 1 + breath - squash, sx = 1 - breath * 0.6 + squash * 0.6;
  const sh = { x: 30, y: -64 };
  const rad = (arm * Math.PI) / 180;
  const hand = { x: sh.x - 44 * Math.sin(rad), y: sh.y + 44 * Math.cos(rad) };
  const headDx = prop === "phone" ? 5 * propOn : 0;
  const headDy = prop ? 4 * propOn : 0; // looks down at what it holds
  return (
    <g transform={`translate(${x},${y}) scale(${s}) rotate(${lean}) scale(${sx},${sy})`} opacity={opacity}>
      <g style={{ filter: `drop-shadow(0 0 ${10 * glow}px rgba(255,255,255,${0.45 * glow})) drop-shadow(0 0 ${34 * glow}px rgba(255,255,255,${0.18 * glow}))` }}>
        <path d="M -48 0 C -50 -46 -38 -84 0 -88 C 38 -84 50 -46 48 0 Q 0 6 -48 0 Z" fill={color} />
        <circle cx={headDx} cy={-120 + headDy} r={29} fill={color} />
        <line x1={sh.x} y1={sh.y} x2={hand.x} y2={hand.y} stroke={color} strokeWidth={17} strokeLinecap="round" />
      </g>
      {prop === "phone" && (
        <g opacity={propOn}>
          <circle cx={hand.x - 6} cy={hand.y - 30} r={70} fill="url(#phoneGlow)" />
          <g transform={`translate(${hand.x - 2},${hand.y - 14}) rotate(-8)`}>
            <rect x={-14} y={-26} width={28} height={50} rx={6} fill="#0c1a24" stroke={C.blue} strokeWidth={3} style={{ filter: neon(C.blue, 0.7) }} />
            <rect x={-9} y={-19} width={18} height={33} rx={2} fill={C.blue} opacity={0.55 + 0.35 * Math.abs(Math.sin(t * 7 + seed))} />
          </g>
        </g>
      )}
      {prop === "book" && (
        <g opacity={propOn}>
          <circle cx={0} cy={-58} r={80} fill="url(#goldGlow)" />
          <g transform={`translate(0,-52) scale(${0.6 + 0.4 * ease(propOn)})`} style={{ filter: neon(C.gold, 0.8) }}>
            <path d="M 0 -18 C -14 -26 -32 -26 -44 -20 L -44 18 C -32 12 -14 12 0 20 Z" fill="#1d1806" stroke={C.gold} strokeWidth={3.5} strokeLinejoin="round" />
            <path d="M 0 -18 C 14 -26 32 -26 44 -20 L 44 18 C 32 12 14 12 0 20 Z" fill="#1d1806" stroke={C.gold} strokeWidth={3.5} strokeLinejoin="round" />
            <path d="M -34 -10 L -10 -6 M -34 0 L -10 4 M 34 -10 L 10 -6 M 34 0 L 10 4" stroke={C.gold} strokeWidth={2} opacity={0.7} />
          </g>
        </g>
      )}
    </g>
  );
};

/** Small caps label, like the references' "YOU" / "YOUR BALANCE". */
export const Label: React.FC<{ x: number; y: number; text: string; color?: string; size?: number; opacity?: number; anchor?: "middle" | "start" }> = ({
  x, y, text, color = C.dim, size = 24, opacity = 1, anchor = "middle",
}) => (
  <text x={x} y={y} textAnchor={anchor} fill={color} opacity={opacity} style={{ font: `700 ${size}px ${FONT}`, letterSpacing: size * 0.22 }}>
    {text}
  </text>
);

/** Pill chip that pops in (scale with overshoot). */
export const Chip: React.FC<{ x: number; y: number; text: string; p: number; color?: string; fill?: string }> = ({ x, y, text, p, color = "#0a0a0a", fill = C.ink }) => {
  if (p <= 0) return null;
  const w = text.length * 17 + 44;
  return (
    <g transform={`translate(${x},${y}) scale(${back(p)})`} opacity={clamp(p * 3)}>
      <rect x={-w / 2} y={-24} width={w} height={48} rx={24} fill={fill} style={{ filter: "drop-shadow(0 0 12px rgba(255,255,255,.35))" }} />
      <text y={9} textAnchor="middle" fill={color} style={{ font: `800 25px ${FONT}`, letterSpacing: 3 }}>{text}</text>
    </g>
  );
};

/** draw-on helper: dash a path of known length */
export const draw = (len: number, p: number) => ({ strokeDasharray: len, strokeDashoffset: len * (1 - clamp(p)) });
