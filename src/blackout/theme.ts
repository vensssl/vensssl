import "@fontsource/anton/400.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/reenie-beanie/400.css";
import { useCurrentFrame, useVideoConfig } from "remotion";
import timing from "../../public/blackout-p2/timing.json";

// Last Signal brand (from the logo/banner canvas)
export const C = {
  bg: "#0B0D14",
  navy: "#141828",
  navy2: "#0E111C",
  steel: "#2A3048",
  ink: "#F2F0EA",
  sub: "#C9CCD8",
  red: "#E5243B",
  warm: "#FFC870",
  dusk: "#1B1424",
};
export const F = {
  display: "Anton, sans-serif",
  body: "Montserrat, sans-serif",
  pencil: "'Reenie Beanie', cursive",
};

export const FPS = 30;
export const T = timing as unknown as {
  lines: Record<string, [number, number]>;
  silenceStart: number;
  endCardStart: number;
  duration: number;
};
/** start / end of a narration line, in seconds */
export const L = (id: string) => T.lines[id][0];
export const LE = (id: string) => T.lines[id][1];

/** absolute time in seconds (works inside Sequences only for local time) */
export const useSec = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f / fps;
};

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ramp = (t: number, t0: number, t1: number) => clamp((t - t0) / (t1 - t0));
export const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeIO = (x: number) => {
  const c = clamp(x);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
