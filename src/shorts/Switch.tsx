import React from "react";
import { AbsoluteFill, Audio, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import timing from "../../public/switch/timing.json";
import words from "../../public/switch/words.json";
import { C, Chip, Defs, Figure, FONT, FPS, Label, Spotlight, back, clamp, draw, ease, easeIO, flickerOn, lerp, neon, ramp } from "../dayone/kit";
import { Captions, EndLine, Finish, Ground, Hud, Punch, Timing, makeGroups, timingFns, useFonts } from "./Shell";

const T = timing as unknown as Timing;
const { L, LE, ev, evs } = timingFns(T);
export const SWITCH_FRAMES = Math.ceil(T.duration * FPS);
const GROUPS = makeGroups(words as never);
const CYAN = "#3FE6D6";
const FLOOR = 1180;

/** motivation level 0..1 */
const level = (t: number) => {
  if (t < ev("wed")) return 1;
  if (t < ev("fri")) return lerp(1, 0.5, easeIO(ramp(t, ev("wed"), ev("wed") + 1.0)));
  return lerp(0.5, 0, easeIO(ramp(t, ev("fri"), ev("fri") + 1.2)));
};
const levelColor = (v: number) => (v > 0.6 ? CYAN : v > 0.2 ? C.gold : C.red);

const Battery: React.FC<{ t: number; x: number; y: number; s: number; v: number; op: number }> = ({ t, x, y, s, v, op }) => {
  const col = levelColor(v);
  const blink = v < 0.05 ? (Math.floor(t * 4) % 2 ? 0.35 : 1) : 1;
  const bars = 4;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={op * blink} style={{ filter: neon(col, 0.7) }}>
      <rect x={-150} y={-72} width={300} height={144} rx={22} fill="#081413" stroke={col} strokeWidth={6} />
      <rect x={152} y={-28} width={22} height={56} rx={6} fill={col} />
      {[...Array(bars)].map((_, i) => {
        const fill = clamp(v * bars - i);
        return fill > 0 ? <rect key={i} x={-130 + i * 66} y={-52} width={56 * fill} height={104} rx={8} fill={col} opacity={0.9} /> : null;
      })}
      {v < 0.05 && <path d="M -10 -46 L -30 4 L 4 4 L -12 48" fill="none" stroke={C.red} strokeWidth={6} strokeLinejoin="round" />}
    </g>
  );
};

const Toggle: React.FC<{ x: number; y: number; s: number; on: number; op?: number }> = ({ x, y, s, on, op = 1 }) => {
  const col = on > 0.5 ? CYAN : C.dim;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={op}>
      <rect x={-70} y={-110} width={140} height={220} rx={22} fill="#0b0d12" stroke={col} strokeWidth={5} style={{ filter: on > 0.5 ? neon(CYAN, 0.8) : undefined }} />
      <rect x={-30} y={-66} width={60} height={132} rx={14} fill="#05060a" stroke={col} strokeWidth={3} />
      <rect x={-24} y={lerp(4, -60, on)} width={48} height={56} rx={10} fill={on > 0.5 ? CYAN : "#c9ccd8"} style={{ filter: on > 0.5 ? neon(CYAN, 0.6) : undefined }} />
      <text y={-80} textAnchor="middle" fill={col} style={{ font: `800 20px ${FONT}`, letterSpacing: 3 }}>ON</text>
      <text y={96} textAnchor="middle" fill={C.dim} style={{ font: `800 20px ${FONT}`, letterSpacing: 3 }}>OFF</text>
    </g>
  );
};

const Rain: React.FC<{ t: number; amt: number }> = ({ t, amt }) => {
  if (amt <= 0) return null;
  const drops = [];
  for (let i = 0; i < 90; i++) {
    const x0 = random(`rx${i}`) * 1200, y0 = random(`ry${i}`) * 2000, sp = 1500 + random(`rs${i}`) * 700;
    const y = ((y0 + t * sp) % 2100) - 100, x = (x0 - t * 160 - (y - y0) * 0.1 + 1200) % 1200 - 60;
    drops.push(<line key={i} x1={x} y1={y} x2={x - 8} y2={y + 46} stroke="#bfefff" strokeWidth={2} opacity={0.18 + 0.25 * random(`ro${i}`)} />);
  }
  return <g opacity={amt}>{drops}</g>;
};

const Stage: React.FC<{ t: number }> = ({ t }) => {
  const v = level(t);
  const flip = ev("flip");
  const on = back(ramp(t, flip, flip + 0.18));
  const lit = flickerOn(t, flip + 0.02);

  // battery: centre stage until it is crossed out on line 06
  const batIn = back(ramp(t, ev("battery"), ev("battery") + 0.4));
  const cross = ramp(t, L("06") + 0.3, L("06") + 0.8);
  const batOut = 1 - ramp(t, LE("06"), LE("06") + 0.35);
  const batS = 0.95 * batIn * lerp(1, 0.85, ramp(t, LE("06"), LE("06") + 0.35));

  // switch: big on 07, small to the left on 08, gone for 09
  const swIn = back(ramp(t, L("07") - 0.1, L("07") + 0.3));
  const toSide = easeIO(ramp(t, L("08") - 0.1, L("08") + 0.5));
  const swOut = 1 - ramp(t, L("09") - 0.1, L("09") + 0.2);
  // 7 small switches, flipped one per day
  const rowIn = ramp(t, L("09"), L("09") + 0.3) * (1 - ramp(t, L("11") - 0.1, L("11") + 0.3));
  // road with a flag for 11–12
  const road = ramp(t, L("11"), L("11") + 0.6);
  const flag = back(ramp(t, ev("arrive"), ev("arrive") + 0.5));

  // the figure
  const runPhase = t < ev("wed") ? 1 : t < ev("fri") ? 0.5 : 0;
  const slump = ease(ramp(t, ev("fri") + 0.4, ev("fri") + 1.2)) * (1 - ease(ramp(t, flip + 0.1, flip + 0.5)));
  const walking = t > flip + 0.6 ? 1 : 0;
  const speed = t < ev("fri") + 0.4 ? runPhase : walking ? 0.6 : 0;
  const bob = Math.abs(Math.sin(t * (6 + 8 * speed))) * 16 * speed;
  const wx0 = 540, wx1 = 780;
  const fx = t < L("11") ? 540 : lerp(250, wx1 - 70, easeIO(ramp(t, L("11") + 0.3, ev("arrive"))));
  const grey = (1 - lit) * slump;
  const col = `rgb(${Math.round(lerp(244, 120, grey))},${Math.round(lerp(243, 123, grey))},${Math.round(lerp(238, 134, grey))})`;
  const quitP = ramp(t, ev("quit"), ev("quit") + 0.25) * (1 - ramp(t, flip, flip + 0.2));

  const rain = ramp(t, evs("rain")[0], evs("rain")[0] + 0.8) * (1 - ramp(t, evs("rain")[1] - 1, evs("rain")[1]));
  const arrive = ramp(t, ev("arrive"), ev("arrive") + 0.4);
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const dayChip = t < ev("wed") ? "MONDAY" : t < ev("fri") ? "WEDNESDAY" : "FRIDAY";
  const dayP = ramp(t, ev("mon"), ev("mon") + 0.3) * (1 - ramp(t, L("05") + 0.6, L("05") + 0.9));
  const chipK = t < ev("wed") ? ramp(t, ev("mon"), ev("mon") + 0.3) : t < ev("fri") ? ramp(t, ev("wed"), ev("wed") + 0.3) : ramp(t, ev("fri"), ev("fri") + 0.3);

  return (
    <g>
      <Spotlight x={fx} floor={FLOOR} on={lerp(0.55, 1, Math.max(lit, 1 - slump)) * clamp(ramp(t, 0.1, 0.4))} spread={170} />
      <rect x={60} y={FLOOR} width={960} height={2} fill="url(#floorFade)" />

      {batOut > 0 && (
        <g>
          <Battery t={t} x={540} y={850} s={batS} v={v} op={batOut} />
          <line x1={360} y1={960} x2={720} y2={740} stroke={C.red} strokeWidth={9} strokeLinecap="round" opacity={batOut} style={{ ...draw(420, cross), filter: neon(C.red, 0.6) }} />
        </g>
      )}
      {dayP > 0 && <Chip x={540} y={732} text={dayChip} p={Math.min(dayP, chipK)} fill={levelColor(v)} />}

      {swIn > 0 && swOut > 0 && (
        <g opacity={swOut}>
          <Toggle x={lerp(540, 230, toSide)} y={lerp(830, 860, toSide)} s={lerp(1.05, 0.6, toSide) * swIn} on={on} />
        </g>
      )}
      {lit > 0 && t < L("09") && <circle cx={540} cy={830} r={lerp(0, 420, ease(ramp(t, flip, flip + 0.5)))} fill="none" stroke={CYAN} strokeWidth={6} opacity={1 - ramp(t, flip, flip + 0.6)} />}

      {/* line 08: "waiting to feel like it", struck out */}
      {(() => {
        const p = ramp(t, L("08") + 0.3, L("08") + 0.6) * (1 - ramp(t, L("09") - 0.1, L("09") + 0.15));
        if (p <= 0) return null;
        return (
          <g transform={`translate(640,860) scale(${back(p)})`} opacity={clamp(p * 3)}>
            <rect x={-190} y={-44} width={380} height={88} rx={44} fill="#0b0d12" stroke={C.ink} strokeWidth={3} />
            <path d="M -120 44 L -140 74 L -90 44" fill="#0b0d12" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
            <text y={10} textAnchor="middle" fill={C.ink} style={{ font: `800 27px ${FONT}`, letterSpacing: 2 }}>WAIT TO FEEL LIKE IT?</text>
            <line x1={-170} y1={0} x2={170} y2={0} stroke={C.red} strokeWidth={6} strokeLinecap="round" style={{ ...draw(340, ramp(t, LE("08") - 0.6, LE("08") - 0.2)), filter: neon(C.red, 0.5) }} />
          </g>
        );
      })()}

      {rowIn > 0 &&
        days.map((d, i) => {
          const x = 210 + i * 110;
          const ot = evs("days")[i];
          const o = back(ramp(t, ot, ot + 0.15));
          const pin = back(ramp(t, L("09") + i * 0.05, L("09") + 0.3 + i * 0.05));
          return (
            <g key={i} opacity={rowIn}>
              <Toggle x={x} y={860} s={0.42 * pin} on={o} />
              <Label x={x} y={940} text={d} color={o > 0.5 ? CYAN : C.dim} size={26} />
            </g>
          );
        })}

      {road > 0 && (
        <g>
          <line x1={170} y1={FLOOR} x2={wx1} y2={FLOOR} stroke={CYAN} strokeWidth={5} strokeLinecap="round" style={{ ...draw(wx1 - 170, road), filter: neon(CYAN, 0.6) }} />
          <Battery t={t} x={190} y={FLOOR - 60} s={0.22 * road} v={1} op={road} />
          <Label x={190} y={FLOOR + 58} text="START" color={CYAN} size={22} opacity={road} />
          <g transform={`translate(${wx1},${FLOOR})`} style={{ filter: neon(arrive > 0 ? CYAN : C.ink, 0.7) }} opacity={ramp(t, L("11") + 0.3, L("11") + 0.6)}>
            <line x1={0} y1={0} x2={0} y2={-250} stroke={arrive > 0 ? CYAN : C.ink} strokeWidth={5} />
            <path d={`M 0 -250 L ${90 * (0.4 + 0.6 * flag)} -${222 - 10 * Math.sin(t * 6)} L 0 -195 Z`} fill={arrive > 0 ? CYAN : "#2a2d36"} stroke={arrive > 0 ? CYAN : C.ink} strokeWidth={3} strokeLinejoin="round" />
          </g>
          <Label x={wx1} y={FLOOR + 58} text="THERE" color={arrive > 0 ? CYAN : C.dim} size={22} opacity={ramp(t, L("12"), L("12") + 0.3)} />
        </g>
      )}

      <Figure
        x={fx} y={FLOOR - bob} s={1.45} t={t} seed={3} color={col} glow={lerp(0.4, 1, 1 - grey)}
        squash={0.16 * slump} lean={speed > 0 ? 5 * speed : -10 * slump} arm={arrive > 0 ? lerp(0, 170, back(arrive)) : speed > 0 ? 25 * Math.sin(t * (6 + 8 * speed)) : 0}
        opacity={clamp(ramp(t, 0.2, 0.5) * 1.5)}
      />
      {quitP > 0 && (
        <g transform={`translate(540,1240) rotate(-8) scale(${lerp(1.6, 1, ease(quitP))})`} opacity={clamp(quitP * 2)}>
          <rect x={-110} y={-40} width={220} height={80} rx={10} fill="none" stroke={C.red} strokeWidth={6} style={{ filter: neon(C.red, 0.5) }} />
          <text y={18} textAnchor="middle" fill={C.red} style={{ font: `800 52px ${FONT}`, letterSpacing: 8 }}>QUIT</text>
        </g>
      )}
      {arrive > 0 && (
        <g opacity={arrive} style={{ filter: neon(CYAN, 0.8) }}>
          {[...Array(8)].map((_, i) => {
            const a = (i / 8) * Math.PI * 2, cx = fx, cy = FLOOR - 200;
            return <line key={i} x1={cx + Math.cos(a) * 110} y1={cy + Math.sin(a) * 110} x2={cx + Math.cos(a) * (110 + 34 * arrive)} y2={cy + Math.sin(a) * (110 + 34 * arrive)} stroke={CYAN} strokeWidth={5} strokeLinecap="round" />;
          })}
        </g>
      )}
      <Rain t={t} amt={rain} />
    </g>
  );
};

export const TheSwitch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  useFonts();
  const flipped = t > ev("flip");
  const v = level(t);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Audio src={staticFile("switch/audio.wav")} />
      <Ground tint={flipped ? "#0f1b1d" : "#15161d"} />
      <Punch t={t} hits={evs("hits")}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <Defs />
        <Stage t={t} />
      </svg>
      </Punch>
      <Hud
        label={flipped ? "DISCIPLINE" : "MOTIVATION"}
        value={flipped ? "ON" : `${Math.round(v * 100)}%`}
        color={flipped ? CYAN : levelColor(v)}
        opacity={ease(ramp(t, 0.25, 0.7))}
      />
      <Captions t={t} groups={GROUPS} accent={CYAN} emph={/^(battery|charged|empty|Dead|quit|switch|flip|Day|there)$/i} />
      <EndLine t={t} at={T.endCardStart + 0.3} text="FLIP THE SWITCH" sub="SAVE THIS FOR TOMORROW MORNING" color={CYAN} />
      <Finish frame={frame} />
    </AbsoluteFill>
  );
};
