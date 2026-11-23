import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import words from "../../public/dayone/words.json";
import { C, Defs, FONT, FPS, L, T, back, clamp, ease, ramp } from "./kit";
import { SceneGraph, SceneStage, SceneStairs, SceneYou, graphDays } from "./scenes";

export const DAYONE_FRAMES = Math.ceil(T.duration * FPS);
const AUDIO = staticFile("dayone/audio.wav");
const E = T.events;

const SCENES: { from: number; render: (t: number) => React.ReactNode }[] = [
  { from: 0, render: (t) => <SceneStage t={t} /> },
  { from: L("09") - 0.2, render: (t) => <SceneGraph t={t} /> },
  { from: L("11") - 0.3, render: (t) => <SceneStairs t={t} /> },
  { from: L("14") - 0.25, render: (t) => <SceneYou t={t} /> },
];

// ---------- the DAY counter (top centre, like the references' balance HUD) ----------
const dayAt = (t: number) => {
  const roll = (a: number, b: number, from: number, to: number) => from + (to - from) * Math.pow(ramp(t, a, b), 1 / 0.8);
  if (t >= L("14") - 0.25) return 1;
  if (t >= L("11") - 0.3) return 365;
  if (t >= L("09") - 0.2) return Math.max(1, Math.round(graphDays(t)));
  if (t >= E.roll100[0]) return Math.round(roll(E.roll100[0], E.roll100[1], 30, 100));
  if (t >= E.roll30[0]) return Math.round(roll(E.roll30[0], E.roll30[1], 1, 30));
  return 1;
};
const Counter: React.FC<{ t: number }> = ({ t }) => {
  const d = dayAt(t);
  const prev = dayAt(t - 1 / FPS);
  const bump = d !== prev ? 1 : 0;
  const trap = t > L("08") && t < L("09") - 0.2;
  const color = trap ? C.red : t > E.impact && t < L("14") - 0.25 ? C.gold : C.ink;
  const inP = ease(ramp(t, 0.25, 0.7));
  return (
    <div style={{ position: "absolute", top: 272, left: 0, right: 0, textAlign: "center", opacity: inP }}>
      <div style={{ font: `700 26px ${FONT}`, letterSpacing: 9, color: C.dim }}>DAY</div>
      <div
        style={{
          font: `800 128px ${FONT}`, lineHeight: 1, color, marginTop: 4,
          transform: `scale(${1 + bump * 0.06})`,
          textShadow: color === C.ink ? "0 0 24px rgba(255,255,255,.25)" : `0 0 26px ${color}88`,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {d}
      </div>
    </div>
  );
};

// ---------- captions: up to 3 words, spoken word in gold ----------
type Word = { text: string; start: number; end: number; line: string };
type Group = { words: Word[]; start: number; end: number };
const GROUPS: Group[] = (() => {
  const out: Group[] = [];
  let cur: Word[] = [];
  const ws = words as Word[];
  ws.forEach((w, i) => {
    cur.push(w);
    const next = ws[i + 1];
    if (cur.length >= 3 || /[.,!?…]$/.test(w.text) || !next || next.line !== w.line) {
      out.push({ words: cur, start: cur[0].start, end: w.end });
      cur = [];
    }
  });
  return out.map((g, i) => ({ ...g, end: Math.min(out[i + 1]?.start ?? Infinity, g.end + 0.4) }));
})();

const Captions: React.FC<{ t: number }> = ({ t }) => {
  const g = GROUPS.find((x) => t >= x.start && t < x.end);
  if (!g) return null;
  const pop = back(ramp(t, g.start, g.start + 0.16));
  return (
    <div style={{ position: "absolute", left: 130, right: 130, top: 500, height: 170, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          font: `800 70px ${FONT}`, lineHeight: 1.1, letterSpacing: 1, textAlign: "center", textTransform: "uppercase",
          color: C.ink, opacity: clamp(pop * 2), transform: `scale(${0.9 + 0.1 * pop})`,
          textShadow: "0 4px 18px rgba(0,0,0,.85)",
        }}
      >
        {g.words.map((w, i) => {
          const active = t >= w.start - 0.03 && t < w.end + 0.05;
          return (
            <span key={i} style={{ color: active ? C.gold : C.ink, textShadow: active ? `0 0 22px ${C.gold}66, 0 4px 18px rgba(0,0,0,.85)` : undefined }}>
              {w.text.replace(/[.,]$/, "")}
              {i < g.words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const EndLine: React.FC<{ t: number }> = ({ t }) => {
  const p = ramp(t, T.endCardStart, T.endCardStart + 0.35);
  const q = ramp(t, T.endCardStart + 0.8, T.endCardStart + 1.2);
  if (p <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 520, textAlign: "center" }}>
      <div style={{ font: `800 84px ${FONT}`, color: C.gold, letterSpacing: 2, opacity: p, transform: `scale(${back(p)})`, textShadow: `0 0 30px ${C.gold}77` }}>
        STARTS TODAY
      </div>
      <div style={{ font: `700 26px ${FONT}`, color: C.dim, letterSpacing: 8, marginTop: 18, opacity: q }}>SAVE THIS FOR DAY 2</div>
    </div>
  );
};

const Grain: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.14, pointerEvents: "none" }}>
    <filter id="g">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 10} />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#g)" />
  </svg>
);

export const DayOne: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(["800 10px Montserrat", "700 10px Montserrat", "500 10px Montserrat"].map((f) => document.fonts.load(f))).then(() => continueRender(handle));
  }, [handle]);

  const idx = SCENES.reduce((acc, s, i) => (t >= s.from ? i : acc), 0);
  const cutIn = idx === 0 ? 1 : ease(ramp(t, SCENES[idx].from, SCENES[idx].from + 0.25));
  const out = idx < SCENES.length - 1 ? 1 - ramp(t, SCENES[idx + 1].from - 0.12, SCENES[idx + 1].from) : 1;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Audio src={AUDIO} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 45% at 50% 58%, #14161f 0%, #07080c 70%)" }} />
      <AbsoluteFill style={{ opacity: cutIn * out }}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <Defs />
          {SCENES[idx].render(t)}
        </svg>
      </AbsoluteFill>
      <Counter t={t} />
      <Captions t={t} />
      <EndLine t={t} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 50%, transparent 55%, rgba(0,0,0,.65) 100%)", pointerEvents: "none" }} />
      <Grain frame={frame} />
    </AbsoluteFill>
  );
};
