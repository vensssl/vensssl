import React from "react";
import { AbsoluteFill, Audio, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import timing from "../../public/wall/timing.json";
import words from "../../public/wall/words.json";
import { C, Chip, Defs, Figure, FONT, FPS, Label, Spotlight, back, clamp, draw, ease, easeIO, flickerOff, flickerOn, lerp, neon, ramp } from "../dayone/kit";
import { Captions, EndLine, Finish, Ground, Hud, Punch, Timing, makeGroups, timingFns, useFonts } from "./Shell";

const T = timing as unknown as Timing;
const { L, LE, ev, evs } = timingFns(T);
export const WALL_FRAMES = Math.ceil(T.duration * FPS);
const GROUPS = makeGroups(words as never);
const PINK = "#FF3D9A";

const FLOOR = 1180, WX0 = 570, WX1 = 800, WT = 830; // wall
const OTHERS = [105, 167, 229, 291, 353, 415];
const HERO = 490;

const Trophy: React.FC<{ x: number; y: number; s?: number; glow?: number }> = ({ x, y, s = 1, glow = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} style={{ filter: neon(PINK, glow) }}>
    <path d="M -34 -96 L 34 -96 L 30 -62 C 26 -40 -26 -40 -30 -62 Z" fill="#26081a" stroke={PINK} strokeWidth={4} strokeLinejoin="round" />
    <path d="M -33 -88 C -58 -88 -56 -60 -28 -56 M 33 -88 C 58 -88 56 -60 28 -56 M 0 -42 L 0 -18" fill="none" stroke={PINK} strokeWidth={4} strokeLinecap="round" />
    <path d="M -24 -18 L 24 -18 L 28 0 L -28 0 Z" fill="#26081a" stroke={PINK} strokeWidth={4} strokeLinejoin="round" />
    <path d="M -8 -82 L 0 -88 L 0 -56" fill="none" stroke={PINK} strokeWidth={3} opacity={0.7} />
  </g>
);

const Wall: React.FC<{ rise: number; glow: number; t: number }> = ({ rise, glow, t }) => {
  const h = FLOOR - WT, rows = 9, rh = h / rows;
  const bricks: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const y = WT + r * rh;
    bricks.push(<line key={`h${r}`} x1={WX0} y1={y} x2={WX1} y2={y} stroke={PINK} strokeWidth={2.5} opacity={0.75} />);
    const off = r % 2 ? 0 : 38;
    for (let x = WX0 + off + 38; x < WX1 - 4; x += 76) bricks.push(<line key={`v${r}-${x}`} x1={x} y1={y} x2={x} y2={y + rh} stroke={PINK} strokeWidth={2.5} opacity={0.75} />);
  }
  const pulse = 0.7 + 0.3 * Math.sin(t * 5);
  return (
    <g>
      <clipPath id="aboveFloor">
        <rect x={0} y={0} width={1080} height={FLOOR} />
      </clipPath>
      <g clipPath="url(#aboveFloor)">
        <g transform={`translate(0,${(1 - rise) * h})`} style={{ filter: neon(PINK, 0.55 + glow * pulse) }}>
          <rect x={WX0} y={WT} width={WX1 - WX0} height={h} fill="#1a0612" stroke={PINK} strokeWidth={4} />
          {bricks}
        </g>
      </g>
    </g>
  );
};

/** walking / hopping position helper */
const hops = (t: number, pts: [number, number][], t0: number, t1: number) => {
  const n = pts.length - 1;
  const p = ramp(t, t0, t1) * n;
  const k = Math.min(n - 1, Math.floor(p)), f = p - k;
  if (p >= n) return { x: pts[n][0], y: pts[n][1], hop: 0, land: 0 };
  const e = easeIO(f);
  return { x: lerp(pts[k][0], pts[k + 1][0], e), y: lerp(pts[k][1], pts[k + 1][1], e) - 46 * Math.sin(Math.PI * f), hop: Math.sin(Math.PI * f), land: Math.max(0, 1 - Math.abs(f - 0.92) * 8) };
};

const Stage: React.FC<{ t: number }> = ({ t }) => {
  const rise = back(ramp(t, ev("wall"), ev("wall") + 1.0));
  const crowdSpot = flickerOn(t, 0.1) * flickerOff(t, ev("lightsOff"));
  const heroSpot = flickerOn(t, L("07") + 0.1);
  const trophySpot = flickerOn(t, 0.5);

  // camera: push in on the hero and the wall for 07–10, pull out for the climb
  const push = easeIO(ramp(t, L("07"), L("07") + 1.2)) * (1 - easeIO(ramp(t, L("11") - 0.2, evs("climb")[0] + 0.6)));
  const zoom = 1 + 0.14 * push, fx = lerp(540, 600, push), fy = 1000;

  // the icons of the hard part
  const icon = (a: number, b: number) => ramp(t, a, a + 0.3) * (1 - ramp(t, b - 0.15, b + 0.1));
  const clockP = icon(ev("clock"), L("04"));
  const repsP = icon(ev("reps"), L("05"));
  const eyeP = icon(L("05") + 0.1, L("06"));
  const ring = t > ev("clock") && t < ev("clock") + 0.6 ? Math.sin(t * 90) * 7 : 0;
  const reps = Math.min(100, Math.round(Math.pow(ramp(t, ev("reps") + 0.2, LE("04") + 0.2), 0.7) * 100));

  // ghosts of the ones who left (line 09)
  const ghosts = ramp(t, L("09") + 0.2, L("09") + 0.8) * (1 - ramp(t, LE("09") - 0.2, LE("09") + 0.4));
  const label = t < L("09") + 1.0 ? "THE HARD PART" : "THE FILTER";
  const labelSwap = t > L("09") + 0.85 && t < L("09") + 1.15 ? 0.2 : 1;

  // hero: plant (line 10), climb (line 11), trophy in hand at the top
  const [c0, c1] = evs("climb");
  const path: [number, number][] = [[HERO, FLOOR], [WX0 + 40, FLOOR - 70], [WX0 + 60, FLOOR - 150], [WX0 + 45, FLOOR - 230], [WX0 + 70, FLOOR - 300], [WX0 + 75, WT]];
  const hp = hops(t, path, c0, c1);
  const plant = ramp(t, ev("plant"), ev("plant") + 0.35);
  const squash = 0.08 * Math.sin(Math.PI * plant) + 0.07 * hp.land - (t > c0 - 0.25 && t < c0 ? 0.1 * Math.sin(Math.PI * ramp(t, c0 - 0.25, c0)) * -1 : 0);
  const top = ramp(t, c1, c1 + 0.4);
  const climbArm = t > c0 && t < c1 ? 160 + 25 * Math.sin(t * 14) : lerp(0, 170, back(top));
  const flash = t > c1 ? Math.exp(-(t - c1) * 6) : 0;

  return (
    <g transform={`translate(${fx},${fy}) scale(${zoom}) translate(${-fx},${-fy})`}>
      <Spotlight x={280} floor={FLOOR} on={crowdSpot} spread={250} />
      <Spotlight x={HERO} floor={FLOOR} on={heroSpot * (1 - top)} spread={150} />
      <Spotlight x={(WX0 + WX1) / 2} floor={WT} on={trophySpot} spread={150} top={170} />
      <rect x={60} y={FLOOR} width={960} height={2} fill="url(#floorFade)" />

      <Wall rise={rise} glow={ramp(t, L("08"), L("08") + 0.4) * (1 - ramp(t, LE("09"), LE("09") + 0.5))} t={t} />
      {rise > 0.9 && (
        <g opacity={clamp((rise - 0.9) * 10) * labelSwap}>
          <rect x={WX0 + 18} y={1000} width={WX1 - WX0 - 36} height={52} rx={6} fill="#07080c" stroke={PINK} strokeWidth={2} />
          <text x={(WX0 + WX1) / 2} y={1035} textAnchor="middle" fill={C.ink} style={{ font: `800 23px ${FONT}`, letterSpacing: 3 }}>{label}</text>
        </g>
      )}
      {top < 1 && <Trophy x={(WX0 + WX1) / 2 + 20} y={WT - 6 - (1 - rise) * 0} glow={0.9} />}

      {/* the hard part, as icons over the crowd */}
      {clockP > 0 && (
        <g transform={`translate(270,880) rotate(${ring}) scale(${back(clockP)})`} opacity={clamp(clockP * 3)} style={{ filter: neon(PINK, 0.7) }}>
          <circle r={52} fill="#1a0612" stroke={PINK} strokeWidth={4} />
          <path d="M -40 -50 L -56 -66 M 40 -50 L 56 -66" stroke={PINK} strokeWidth={6} strokeLinecap="round" />
          <text y={12} textAnchor="middle" fill={C.ink} style={{ font: `800 34px ${FONT}` }}>5:00</text>
        </g>
      )}
      {repsP > 0 && (
        <g transform={`translate(270,880) scale(${back(repsP)})`} opacity={clamp(repsP * 3)}>
          <g transform={`translate(0,${-Math.abs(Math.sin(t * 7)) * 14})`} style={{ filter: neon(PINK, 0.7) }}>
            <rect x={-62} y={-30} width={22} height={60} rx={5} fill="#1a0612" stroke={PINK} strokeWidth={4} />
            <rect x={40} y={-30} width={22} height={60} rx={5} fill="#1a0612" stroke={PINK} strokeWidth={4} />
            <line x1={-40} y1={0} x2={40} y2={0} stroke={PINK} strokeWidth={7} />
          </g>
          <text y={82} textAnchor="middle" fill={C.ink} style={{ font: `800 30px ${FONT}`, letterSpacing: 3 }}>REPS {reps}</text>
        </g>
      )}
      {eyeP > 0 && (
        <g transform={`translate(270,880) scale(${back(eyeP)})`} opacity={clamp(eyeP * 3)} style={{ filter: neon(C.ink, 0.5) }}>
          <path d="M -60 0 C -30 -40 30 -40 60 0 C 30 40 -30 40 -60 0 Z" fill="none" stroke={C.ink} strokeWidth={4} />
          <circle r={14} fill={C.ink} />
          <line x1={-56} y1={-44} x2={56} y2={44} stroke={PINK} strokeWidth={6} strokeLinecap="round" style={draw(142, ramp(t, L("05") + 0.6, L("05") + 1.0))} />
          <text y={90} textAnchor="middle" fill={C.ink} style={{ font: `800 30px ${FONT}`, letterSpacing: 3 }}>VIEWS 0</text>
        </g>
      )}

      {/* the crowd: one by one they turn around and walk off */}
      {OTHERS.map((x, i) => {
        const lt = evs("leave")[i];
        const turn = ramp(t, lt, lt + 0.2);
        const walk = ramp(t, lt + 0.2, lt + 1.6);
        const px = x - walk * (x + 160);
        const bob = walk > 0 && walk < 1 ? Math.abs(Math.sin(walk * 22)) * 10 : 0;
        const dim = t > ev("lightsOff") ? 0.55 : 1;
        const op = (1 - ramp(walk, 0.4, 1)) * dim * clamp(ramp(t, 0.1 + i * 0.09, 0.3 + i * 0.09) * 1.5);
        return op > 0 ? <Figure key={i} x={px} y={FLOOR - bob} s={0.6} t={t} seed={i} squash={0.1 * Math.sin(Math.PI * turn)} lean={-6 * Math.min(1, walk * 8)} opacity={op} glow={dim * 0.6} /> : null;
      })}
      {ghosts > 0 &&
        OTHERS.map((x, i) => (
          <g key={`g${i}`} opacity={ghosts * 0.5} transform={`translate(${x},${FLOOR}) scale(0.6)`}>
            <path d="M -48 0 C -50 -46 -38 -84 0 -88 C 38 -84 50 -46 48 0 Z" fill="none" stroke={C.dim} strokeWidth={3} strokeDasharray="8 8" />
            <circle cy={-120} r={29} fill="none" stroke={C.dim} strokeWidth={3} strokeDasharray="8 8" />
          </g>
        ))}

      <Figure
        x={t < c0 ? HERO : hp.x} y={t < c0 ? FLOOR : hp.y} s={1.05} t={t} seed={9} arm={climbArm}
        squash={squash} lean={t > c0 && t < c1 ? -8 * hp.hop : 0} opacity={clamp(ramp(t, 0.6, 0.9) * 1.5)}
        glow={t > ev("lightsOff") && t < L("07") ? 0.55 : 1}
      />
      {top > 0 && <Trophy x={hp.x + 34} y={WT - 210 - 10 * Math.sin(t * 3)} s={0.62 + 0.1 * back(top)} glow={1.2} />}
      {top > 0 && (
        <g opacity={top} style={{ filter: neon(PINK, 0.8) }}>
          {[...Array(8)].map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            const cx = hp.x + 34, cy = WT - 250;
            return <line key={i} x1={cx + Math.cos(a) * 80} y1={cy + Math.sin(a) * 80} x2={cx + Math.cos(a) * (80 + 36 * top)} y2={cy + Math.sin(a) * (80 + 36 * top)} stroke={PINK} strokeWidth={5} strokeLinecap="round" />;
          })}
        </g>
      )}
      <Chip x={HERO} y={FLOOR + 58} text="STAYED" p={ramp(t, ev("plant"), ev("plant") + 0.35) * (1 - ramp(t, c0, c0 + 0.2))} fill={PINK} color="#fff" />
      <Label x={250} y={FLOOR + 58} text="EVERYONE ELSE" opacity={clamp(ramp(t, 0.6, 1.0)) * (1 - ramp(t, evs("leave")[5], evs("leave")[5] + 1))} />
      <rect x={-60} y={-60} width={1200} height={2040} fill="#fff" opacity={flash * 0.3} />
    </g>
  );
};

export const TheWall: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  useFonts();
  const leaves = evs("leave");
  const here = 7 - leaves.filter((x) => t > x + 0.2).length;
  const hereBefore = 7 - leaves.filter((x) => t - 1 / FPS > x + 0.2).length;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Audio src={staticFile("wall/audio.wav")} />
      <Ground tint="#1a1119" />
      <Punch t={t} hits={evs("hits")}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <Defs />
        <Stage t={t} />
      </svg>
      </Punch>
      <Hud label="STILL HERE" value={String(here)} color={here === 1 ? PINK : C.ink} opacity={ease(ramp(t, 0.25, 0.7)) * (1 - ramp(t, evs("climb")[1] + 0.2, evs("climb")[1] + 0.5))} bump={here !== hereBefore} />
      <Captions t={t} groups={GROUPS} accent={PINK} emph={/^(trophy|5AM|again|quit|wall|NOT|stop|bad|stay|climb)$/i} />
      <EndLine t={t} at={evs("climb")[1] + 0.5} text="STAY WHEN THEY LEAVE" sub="SAVE THIS FOR THE HARD DAYS" color={PINK} top={300} />
      <Finish frame={frame} />
    </AbsoluteFill>
  );
};
void random;
