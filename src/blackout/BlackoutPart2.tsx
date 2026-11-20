import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import words from "../../public/blackout-p2/words.json";
import { C, F, L, LE, T, ease, ramp } from "./theme";
import { DayCard, EndCard, Scene6A, SceneCandle, SceneDoor, SceneHallway, SceneNote, SceneNotebook, SceneRadio, SceneStreet } from "./scenes";

type Word = { text: string; start: number; end: number; line: string; voice: string };
const AUDIO = staticFile("blackout-p2/audio.wav");

// Which scene plays when (seconds). Cuts land just before the line that needs them.
const SCENES: { from: number; render: (t: number, levels: number[]) => React.ReactNode }[] = [
  { from: 0, render: (t) => <SceneDoor t={t} /> },
  { from: L("08") - 0.2, render: (t) => <SceneNote t={t} /> },
  { from: L("11") - 0.3, render: (t) => <DayCard t={t} day="DAY 5" start={L("11") - 0.3} /> },
  { from: L("12") - 0.2, render: (t) => <SceneHallway t={t} /> },
  { from: L("16") - 0.2, render: (t) => <Scene6A t={t} /> },
  { from: L("20") - 0.2, render: (t, lv) => <SceneRadio t={t} levels={lv} /> },
  { from: L("23") - 0.2, render: (t) => <SceneCandle t={t} /> },
  { from: L("26") - 0.3, render: (t) => <DayCard t={t} day="DAY 6" start={L("26") - 0.3} /> },
  { from: L("27") - 0.2, render: (t) => <SceneNotebook t={t} /> },
  { from: L("31") - 0.2, render: (t) => <SceneStreet t={t} /> },
  { from: T.silenceStart, render: () => <AbsoluteFill style={{ background: "#000" }} /> },
  { from: T.endCardStart, render: (t) => <EndCard t={t} /> },
];

// Caption groups: up to 3 words, break on punctuation, never across lines.
type Group = { words: Word[]; start: number; end: number; voice: string };
const GROUPS: Group[] = (() => {
  const out: Group[] = [];
  let cur: Word[] = [];
  const ws = words as Word[];
  ws.forEach((w, i) => {
    cur.push(w);
    const next = ws[i + 1];
    if (cur.length >= 3 || /[.,!?…]$/.test(w.text) || !next || next.line !== w.line) {
      out.push({ words: cur, start: cur[0].start, end: w.end, voice: w.voice });
      cur = [];
    }
  });
  return out.map((g, i) => ({ ...g, end: Math.min(out[i + 1]?.start ?? Infinity, g.end + 0.35) }));
})();

const Captions: React.FC<{ t: number }> = ({ t }) => {
  const g = GROUPS.find((x) => t >= x.start && t < x.end);
  if (!g || t >= T.silenceStart) return null;
  const pop = ease(ramp(t, g.start, g.start + 0.12));
  const radio = g.voice === "bm_george";
  const whisper = g.voice === "af_heart";
  return (
    // bottom of the 9:16 safe band (≤ y 1248), clear of TikTok's right-hand rail
    <div style={{ position: "absolute", left: 120, right: 190, top: 1000, height: 240, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: radio ? F.body : F.display,
          fontWeight: radio ? 800 : 400,
          fontStyle: whisper ? "italic" : "normal",
          fontSize: radio ? 72 : whisper ? 78 : 92,
          lineHeight: 1.08,
          letterSpacing: radio ? 3 : 2,
          textAlign: "center",
          textTransform: "uppercase",
          color: C.ink,
          WebkitTextStroke: "12px #05060b",
          paintOrder: "stroke",
          transform: `scale(${0.92 + 0.08 * pop})`,
          opacity: pop,
        }}
      >
        {g.words.map((w, i) => {
          const active = t >= w.start && t < w.end + 0.05;
          const color = radio ? (active ? C.red : "#f2b7bd") : active ? C.red : whisper ? C.sub : C.ink;
          return (
            <span key={i} style={{ color }}>
              {w.text}
              {i < g.words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const Grain: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.22, pointerEvents: "none" }}>
    <filter id="g">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 12} />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#g)" />
  </svg>
);

export const BlackoutPart2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // wait for the brand fonts before the first frame
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(["400 10px Anton", "800 10px Montserrat", "700 10px Montserrat", "400 10px 'Reenie Beanie'"].map((f) => document.fonts.load(f))).then(
      () => continueRender(handle),
    );
  }, [handle]);

  const audio = useAudioData(AUDIO);
  const levels = audio ? visualizeAudio({ fps, frame, audioData: audio, numberOfSamples: 32, optimizeFor: "speed" }).slice(2, 26).map((v) => Math.min(1, 0.15 + v * 14)) : [];

  const idx = SCENES.reduce((acc, s, i) => (t >= s.from ? i : acc), 0);
  const sceneStart = SCENES[idx].from;
  const cutIn = idx === 0 ? 1 : ease(ramp(t, sceneStart, sceneStart + 0.2));
  const flicker = t < T.silenceStart ? 1 - (random(`f${Math.floor(t * 12)}`) > 0.93 ? 0.12 : 0) : 1;
  const inStory = t < T.silenceStart;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={AUDIO} />
      <AbsoluteFill style={{ opacity: cutIn * flicker }}>{SCENES[idx].render(t, levels)}</AbsoluteFill>
      {inStory && (
        <>
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,.65) 100%)" }} />
          <Grain frame={frame} />
          {/* series tag, inside the top safe line */}
          <div style={{ position: "absolute", top: 300, width: 1080, display: "flex", justifyContent: "center", gap: 14, alignItems: "center" }}>
            <div style={{ fontFamily: F.body, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: C.ink, opacity: 0.85 }}>BLACKOUT</div>
            <div style={{ padding: "4px 14px", borderRadius: 8, background: C.red, fontFamily: F.body, fontWeight: 800, fontSize: 26, letterSpacing: 3, color: "#fff" }}>PART 2</div>
          </div>
          <Captions t={t} />
        </>
      )}
    </AbsoluteFill>
  );
};

export const BLACKOUT_P2_FRAMES = Math.ceil(T.duration * 30);
export { L, LE };
