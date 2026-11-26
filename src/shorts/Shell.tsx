import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { C, FONT, back, clamp, ease, ramp } from "../dayone/kit";

export type Timing = {
  lines: Record<string, [number, number]>;
  events: Record<string, number | number[]>;
  endCardStart: number;
  duration: number;
};
export const timingFns = (T: Timing) => ({
  L: (id: string) => T.lines[id][0],
  LE: (id: string) => T.lines[id][1],
  ev: (k: string) => T.events[k] as number,
  evs: (k: string) => T.events[k] as number[],
});

export const useFonts = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(["800 10px Montserrat", "700 10px Montserrat"].map((f) => document.fonts.load(f))).then(() => continueRender(handle));
  }, [handle]);
};

type Word = { text: string; start: number; end: number; line: string };
type Group = { words: Word[]; start: number; end: number };
export const makeGroups = (ws: Word[]): Group[] => {
  const out: Group[] = [];
  let cur: Word[] = [];
  ws.forEach((w, i) => {
    cur.push(w);
    const next = ws[i + 1];
    if (cur.length >= 3 || /[.,!?…]$/.test(w.text) || !next || next.line !== w.line) {
      out.push({ words: cur, start: cur[0].start, end: w.end });
      cur = [];
    }
  });
  return out.map((g, i) => ({ ...g, end: Math.min(out[i + 1]?.start ?? Infinity, g.end + 0.4) }));
};

/** 0..1 punch envelope: jumps to 1 on each hit time and decays fast */
export const punchAt = (t: number, hits: number[]) => hits.reduce((m, h) => (t >= h && t < h + 0.8 ? Math.max(m, Math.exp(-(t - h) * 7)) : m), 0);

/** zoom punch + shake + flash on the hit moments */
export const Punch: React.FC<{ t: number; hits: number[]; children: React.ReactNode }> = ({ t, hits, children }) => {
  const p = punchAt(t, hits);
  const sx = p > 0.05 ? Math.sin(t * 97) * 14 * p : 0, sy = p > 0.05 ? Math.cos(t * 83) * 10 * p : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translate(${sx}px,${sy}px) scale(${1 + 0.07 * p})` }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: Math.max(0, p - 0.6) * 0.6, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

export const Captions: React.FC<{ t: number; groups: Group[]; accent: string; top?: number; emph?: RegExp }> = ({ t, groups, accent, top = 500, emph }) => {
  const g = groups.find((x) => t >= x.start && t < x.end);
  if (!g) return null;
  const pop = back(ramp(t, g.start, g.start + 0.14));
  return (
    <div style={{ position: "absolute", left: 130, right: 130, top, height: 170, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          font: `800 70px ${FONT}`, lineHeight: 1.1, letterSpacing: 1, textAlign: "center", textTransform: "uppercase",
          color: C.ink, opacity: clamp(pop * 2), transform: `scale(${0.7 + 0.3 * pop})`, textShadow: "0 4px 18px rgba(0,0,0,.85)",
        }}
      >
        {g.words.map((w, i) => {
          const active = t >= w.start - 0.03 && t < w.end + 0.05;
          const big = emph ? emph.test(w.text.replace(/[^\w%]/g, "")) : false;
          const slam = big ? back(ramp(t, w.start - 0.03, w.start + 0.12)) : 1;
          return (
            <span
              key={i}
              style={{
                color: active || (big && t >= w.start) ? accent : C.ink,
                fontSize: big ? "1.3em" : undefined,
                display: big ? "inline-block" : undefined,
                margin: big ? "0 0.28em" : undefined,
                transform: big ? `scale(${t < w.start - 0.03 ? 1 : 0.6 + 0.4 * slam})` : undefined,
                textShadow: active || big ? `0 0 26px ${accent}88, 0 4px 18px rgba(0,0,0,.85)` : undefined,
              }}
            >
              {w.text.replace(/[.,]$/, "")}
              {i < g.words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** top-centre HUD, like the references' "YOUR BALANCE $0" */
export const Hud: React.FC<{ label: string; value: string; color?: string; opacity?: number; bump?: boolean }> = ({ label, value, color = C.ink, opacity = 1, bump }) => (
  <div style={{ position: "absolute", top: 272, left: 0, right: 0, textAlign: "center", opacity }}>
    <div style={{ font: `700 26px ${FONT}`, letterSpacing: 9, color: C.dim }}>{label}</div>
    <div
      style={{
        font: `800 128px ${FONT}`, lineHeight: 1, color, marginTop: 4, fontVariantNumeric: "tabular-nums",
        transform: `scale(${bump ? 1.06 : 1})`, textShadow: color === C.ink ? "0 0 24px rgba(255,255,255,.25)" : `0 0 26px ${color}88`,
      }}
    >
      {value}
    </div>
  </div>
);

export const EndLine: React.FC<{ t: number; at: number; text: string; sub: string; color: string; top?: number }> = ({ t, at, text, sub, color, top = 520 }) => {
  const p = ramp(t, at, at + 0.35), q = ramp(t, at + 0.8, at + 1.2);
  if (p <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top, textAlign: "center" }}>
      <div style={{ font: `800 80px ${FONT}`, lineHeight: 1.05, color, letterSpacing: 2, opacity: p, transform: `scale(${back(p)})`, textShadow: `0 0 30px ${color}77` }}>{text}</div>
      <div style={{ font: `700 26px ${FONT}`, color: C.dim, letterSpacing: 8, marginTop: 18, opacity: q }}>{sub}</div>
    </div>
  );
};

export const Finish: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 50%, transparent 55%, rgba(0,0,0,.65) 100%)", pointerEvents: "none" }} />
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.14, pointerEvents: "none" }}>
      <filter id="g">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 10} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#g)" />
    </svg>
  </>
);

export const Ground: React.FC<{ tint?: string }> = ({ tint = "#14161f" }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 45% at 50% 58%, ${tint} 0%, #07080c 70%)` }} />
);

export { ease };
