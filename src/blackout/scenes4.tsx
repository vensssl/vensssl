import React from "react";
import { random } from "remotion";
import { Door } from "./scenes";
import { C, F, L, LE, T, clamp, ease, easeIO, lerp, ramp } from "./theme4";

type P = { t: number };
const W = 1080;
const H = 1920;

const Svg: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, ...style }}>
    {children}
  </svg>
);

const PAPER = {
  background: "#cfc8b8",
  backgroundImage:
    "linear-gradient(90deg, transparent 110px, rgba(229,36,59,.55) 110px 114px, transparent 114px), repeating-linear-gradient(transparent 0 118px, rgba(60,80,140,.28) 118px 121px)",
} as const;

/* A notebook page in someone else's handwriting. `write` 0..1 reveals the message line by line. */
const StrangePage: React.FC<{ write: number[]; circle?: number; date?: number; tilt?: number }> = ({ write, circle = 0, date = 0, tilt = -3 }) => {
  const lines = ["Mark.", "You already forgot once.", "Don't let them make", "you forget again."];
  return (
    <div style={{ position: "absolute", left: 70, top: 380, width: 940, height: 880, ...PAPER, transform: `rotate(${tilt}deg)`, boxShadow: "0 40px 100px rgba(0,0,0,.85)" }}>
      {/* a sharper, slanted hand than Mark's */}
      <div style={{ position: "absolute", left: 140, top: 46, fontFamily: F.pencil, fontSize: 96, color: "#1f2230", lineHeight: "121px", transform: "skewX(-12deg)", fontWeight: 400 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap", clipPath: `inset(0 ${100 - clamp(write[i] ?? 0) * 100}% 0 0)` }}>
            {l}
          </div>
        ))}
      </div>
      {circle > 0 && (
        <svg width={940} height={880} style={{ position: "absolute", inset: 0 }}>
          <ellipse cx={470} cy={225} rx={400} ry={78} fill="none" stroke={C.red} strokeWidth={8} strokeDasharray={1900} strokeDashoffset={1900 * (1 - circle)} transform="rotate(-2 470 225)" />
        </svg>
      )}
      {date > 0 && (
        <div style={{ position: "absolute", left: 380, top: 540, fontFamily: F.pencil, fontSize: 120, color: C.red, transform: "rotate(-4deg) skewX(-12deg)", clipPath: `inset(0 ${100 - date * 100}% 0 0)`, whiteSpace: "nowrap" }}>
          — Day 8
        </div>
      )}
    </div>
  );
};

/* 0 → line 03: the hook. Frame 0 already shows the page and the circled line. */
export const SceneHook: React.FC<P> = ({ t }) => {
  const push = lerp(1.0, 1.12, easeIO(ramp(t, 0, L("03"))));
  const jolt = t > L("02") ? Math.exp(-(t - L("02")) * 6) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#08090e", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push + jolt * 0.04}) rotate(${jolt * -1}deg)`, transformOrigin: "540px 650px" }}>
        <StrangePage write={[1, 1, 1, 1]} circle={1} />
      </div>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 540px 640px, rgba(255,200,112,.14), transparent 55%)" }} />
    </div>
  );
};

/* line 03 → 06: the city goes dark, red X on every door, except 6B */
export const SceneRecap: React.FC<P> = ({ t }) => {
  if (t < L("04")) {
    const dark = ramp(t, L("03") + 1.0, LE("03"));
    return (
      <Svg>
        <rect width={W} height={H} fill="#06070c" />
        {[
          [0, 900, 220], [200, 700, 180], [360, 520, 200], [540, 760, 170], [700, 600, 220], [900, 820, 180],
        ].map(([x, y, w], b) => (
          <g key={b}>
            <rect x={x} y={y} width={w} height={H - y} fill="#11141f" />
            {Array.from({ length: Math.floor((1300 - y) / 70) }).map((_, r) =>
              Array.from({ length: Math.floor(w / 55) }).map((__, c) => {
                const off = random(`w${b}${r}${c}`) * 0.9 < dark * 1.05;
                return off ? null : <rect key={`${r}${c}`} x={x + 16 + c * 55} y={y + 30 + r * 70} width={26} height={36} fill={C.warm} opacity={0.75} />;
              }),
            )}
          </g>
        ))}
        <rect y={1300} width={W} height={620} fill="#05060a" />
      </Svg>
    );
  }
  if (t < L("05")) {
    // quick cuts: four marked doors
    const span = (L("05") - L("04")) / 4;
    const i = Math.min(3, Math.floor((t - L("04")) / span));
    const k = ramp(t, L("04") + i * span, L("04") + i * span + span * 0.7);
    return <Door t={t} label={["4A", "5C", "6A", "6C"][i]} xMark={k} day={1} />;
  }
  const k = ease(ramp(t, L("05"), L("05") + 0.4));
  return (
    <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1.08, 1, k)})` }}>
      <Door t={t} label="6B" day={1} />
      <Svg>
        <rect x={300} y={360} width={480} height={960} fill="none" stroke={C.ink} strokeWidth={4} strokeDasharray="20 18" opacity={0.25 + 0.2 * Math.sin(t * 4)} />
      </Svg>
    </div>
  );
};

/* Street-level grate (shared by the voice, the lift and the headlights) */
const Alley: React.FC<{ t: number; glow: number; lift: number; lights: number; people: number }> = ({ t, glow, lift, lights, people }) => {
  const gx = 340, gy = 1160, gw = 400, gh = 150;
  const sweep = lerp(1400, -200, easeIO(lights));
  return (
    <Svg>
      <defs>
        <radialGradient id="gl" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.warm} stopOpacity={0.55} />
          <stop offset="1" stopColor={C.warm} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="beam" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#fff6dc" stopOpacity={0.7} />
          <stop offset="1" stopColor="#fff6dc" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="#07080d" />
      <g transform="translate(0 230)">
      {/* brick walls of the alley */}
      <polygon points="0,0 300,500 300,1000 0,1300" fill="#151927" />
      <polygon points={`${W},0 780,500 780,1000 ${W},1300`} fill="#121522" />
      <polygon points="300,500 780,500 780,1000 300,1000" fill="#0b0d16" />
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={i} x1={0} y1={120 + i * 100} x2={300} y2={540 + i * 42} stroke="#0c0e18" strokeWidth={5} />
      ))}
      {/* asphalt */}
      <polygon points={`0,1300 300,1000 780,1000 ${W},1300 ${W},${H} 0,${H}`} fill="#0d0f17" />
      {/* the grate opening and the light from below */}
      <ellipse cx={gx + gw / 2} cy={gy + gh / 2} rx={gw * 0.9} ry={gh * 1.3} fill="url(#gl)" opacity={glow} />
      <rect x={gx} y={gy} width={gw} height={gh} fill={glow > 0 ? "#2a1d0e" : "#030305"} />
      <rect x={gx} y={gy} width={gw} height={gh} fill={C.warm} opacity={glow * 0.35} />
      <g transform={`translate(${lift * 420} ${-lift * 30})`}>
        <rect x={gx - 10} y={gy - 10} width={gw + 20} height={gh + 20} fill="none" stroke="#3a3f52" strokeWidth={16} />
        {Array.from({ length: 9 }).map((_, i) => (
          <rect key={i} x={gx + 14 + i * 44} y={gy} width={16} height={gh} fill="#2e3344" />
        ))}
      </g>
      {/* Mark and Mrs. Alvarez at the edge */}
      {people > 0 && (
        <g opacity={people} fill="#020306">
          <g transform="translate(250 1150)">
            <rect x={-26} y={-190} width={52} height={130} rx={12} />
            <rect x={-22} y={-64} width={18} height={90} /><rect x={4} y={-64} width={18} height={90} />
            <circle cy={-222} r={32} />
          </g>
          <g transform="translate(150 1170)">
            <path d="M -40 -150 L 40 -150 L 55 20 L -55 20 Z" />
            <circle cy={-180} r={28} />
            <rect x={30} y={-140} width={70} height={14} rx={7} transform="rotate(-8 30 -140)" />
          </g>
        </g>
      )}
      {/* headlights sweeping in from the street */}
      {lights > 0 && (
        <g opacity={clamp(lights * 3)}>
          <polygon points={`${W + 200},${1000 - 60} ${sweep},700 ${sweep},1500 ${W + 200},${1000 + 60}`} fill="url(#beam)" />
          <circle cx={W - 30} cy={1000} r={60} fill="#fff6dc" opacity={0.9} />
        </g>
      )}
      </g>
      {lights > 0 && <rect width={W} height={H} fill="#fff6dc" opacity={0.18 * Math.max(0, Math.sin(clamp(lights) * Math.PI))} />}
      <circle cx={0} cy={0} r={0} opacity={t * 0} />
    </Svg>
  );
};

/* line 06 → 09: a voice under the street */
export const SceneVoice: React.FC<P> = ({ t }) => {
  const push = lerp(1.0, 1.35, easeIO(ramp(t, L("06"), LE("08"))));
  const pulse = 0.55 + 0.45 * Math.sin(t * 2.4);
  const whisper = ramp(t, L("08"), L("08") + 0.3);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "540px 1460px" }}>
        <Alley t={t} glow={pulse * (0.6 + 0.4 * whisper)} lift={0} lights={0} people={0} />
      </div>
    </div>
  );
};

/* line 09 → 16: grate lifts, the shaft, the grip, the headlights */
export const SceneGrate: React.FC<P> = ({ t }) => {
  const lift = ease(ramp(t, L("09") + 0.2, L("09") + 1.2));
  if (t >= L("10") && t < L("11")) {
    // looking straight down the shaft
    const k = ramp(t, L("10"), LE("10"));
    return (
      <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>
        <Svg style={{ transform: `scale(${lerp(1, 1.5, easeIO(k))})`, transformOrigin: "540px 960px" }}>
          {Array.from({ length: 14 }).map((_, i) => {
            const d = i / 14, s = 1 - d * 0.93;
            const w = 900 * s, h = 900 * s;
            return <rect key={i} x={540 - w / 2} y={960 - h / 2} width={w} height={h} fill="none" stroke={`rgba(90,98,130,${0.5 * (1 - d)})`} strokeWidth={6 * s + 1} />;
          })}
          {Array.from({ length: 12 }).map((_, i) => {
            const s = 1 - (i / 12) * 0.9;
            return <rect key={`r${i}`} x={540 - 160 * s} y={960 + 380 * s} width={320 * s} height={12 * s} rx={4} fill={`rgba(150,100,70,${0.8 * s})`} />;
          })}
          <rect x={530} y={950} width={20} height={20} fill="#000" />
        </Svg>
      </div>
    );
  }
  const grip = t >= L("11") && t < L("13");
  const lights = ramp(t, L("15") - 0.2, LE("15") + 0.3);
  const shake = t > L("13") + 1 ? Math.sin(t * 47) * 2.5 * ramp(t, L("13") + 1, L("14")) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${shake}px) scale(${grip ? 1.25 : 1.12})`, transformOrigin: "300px 1380px" }}>
        <Alley t={t} glow={0.35} lift={lift} lights={lights} people={t >= L("11") ? 1 : 0} />
      </div>
      {grip && (
        <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 260px rgba(229,36,59,${0.18 + 0.1 * Math.sin(t * 6)})` }} />
      )}
    </div>
  );
};

/* line 16 → 17: down the ladder */
export const SceneDescend: React.FC<P> = ({ t }) => {
  const s = L("16") - 0.2;
  const y = ((t - s) * 520) % 160;
  const light = 1 - ramp(t, s, s + 1.4);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#020203", overflow: "hidden" }}>
      <Svg>
        <rect x={340} y={0} width={18} height={H} fill="#3a2a20" />
        <rect x={722} y={0} width={18} height={H} fill="#3a2a20" />
        {Array.from({ length: 14 }).map((_, i) => (
          <rect key={i} x={340} y={i * 160 - 160 + y} width={400} height={20} rx={6} fill="#5a3a28" />
        ))}
        <rect width={W} height={H} fill="url(#fade4)" />
        <defs>
          <linearGradient id="fade4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff6dc" stopOpacity={0.25 * light} />
            <stop offset="0.5" stopColor="#000" stopOpacity={0.2} />
            <stop offset="1" stopColor="#000" stopOpacity={0.95} />
          </linearGradient>
        </defs>
      </Svg>
    </div>
  );
};

/* A small person silhouette standing in the tunnel */
export const Figure: React.FC<{ x: number; y: number; s: number; kind: "kid" | "old" | "nurse" | "man" | "woman"; o: number }> = ({ x, y, s, kind, o }) => {
  const h = kind === "kid" ? 0.62 : 1;
  const body = kind === "nurse" ? "#2d5a5c" : "#06070b";
  return (
    <g transform={`translate(${x} ${y}) scale(${s * h})`} opacity={o}>
      <rect x={-24} y={-180} width={48} height={120} rx={12} fill={body} />
      <rect x={-20} y={-62} width={16} height={62} fill={kind === "nurse" ? "#24494b" : "#06070b"} />
      <rect x={4} y={-62} width={16} height={62} fill={kind === "nurse" ? "#24494b" : "#06070b"} />
      <circle cy={-208} r={28} fill="#06070b" />
      {kind === "old" && <line x1={36} y1={-110} x2={52} y2={0} stroke="#06070b" strokeWidth={7} />}
      {kind === "woman" && <path d="M -26 -170 L 26 -170 L 40 -40 L -40 -40 Z" fill="#06070b" />}
    </g>
  );
};

/* Arched brick tunnel with candles */
export const Tunnel: React.FC<{ t: number; people: number; cam: number }> = ({ t, people, cam }) => {
  const rings = Array.from({ length: 9 }, (_, i) => i / 9);
  const cand = [0.1, 0.25, 0.42, 0.6, 0.78];
  return (
    <Svg style={{ transform: `scale(${cam})`, transformOrigin: "540px 1000px" }}>
      <rect width={W} height={H} fill="#0b0a0c" />
      {rings.map((d, i) => {
        const s = 1 - d * 0.85, w = 1200 * s, cy = 1000;
        const top = cy - 760 * s, bot = cy + 640 * s;
        return (
          <path key={i} d={`M ${540 - w / 2} ${bot} L ${540 - w / 2} ${cy - 200 * s} Q ${540 - w / 2} ${top} 540 ${top} Q ${540 + w / 2} ${top} ${540 + w / 2} ${cy - 200 * s} L ${540 + w / 2} ${bot}`} fill="none" stroke={`rgba(70,42,32,${0.9 - d * 0.6})`} strokeWidth={30 * s} />
        );
      })}
      <polygon points="0,1640 1080,1640 600,1100 480,1100" fill="#0e0c0d" />
      <polygon points="460,1640 620,1640 556,1110 524,1110" fill="#151a24" opacity={0.6} />
      {cand.map((d, i) =>
        [0, 1].map((side) => {
          const s = 1 - d * 0.85;
          const x = side ? 540 + 560 * s : 540 - 560 * s;
          const y = 1000 - 60 * s;
          const fl = 1 + 0.12 * Math.sin(t * 13 + i * 3 + side) + 0.06 * Math.sin(t * 31 + i);
          return (
            <g key={`${i}${side}`}>
              <circle cx={x} cy={y - 30 * s} r={200 * s * fl} fill={C.warm} opacity={0.08} />
              <rect x={x - 9 * s} y={y} width={18 * s} height={60 * s} fill="#d9cdb0" />
              <ellipse cx={x} cy={y - 18 * s * fl} rx={9 * s} ry={22 * s * fl} fill={C.warm} />
            </g>
          );
        }),
      )}
      {/* the people, revealed left to right on line 19-20 */}
      {(
        [
          [210, 1250, 1.5, "man", 0],
          [370, 1170, 1.15, "kid", 0.3],
          [460, 1110, 0.95, "kid", 0.45],
          [700, 1190, 1.25, "old", 0.6],
          [880, 1280, 1.55, "nurse", 0.9],
          [600, 1080, 0.8, "woman", 0.2],
          [300, 1090, 0.75, "man", 0.5],
          [790, 1100, 0.85, "man", 0.7],
        ] as const
      ).map(([x, y, s, k, at], i) => (
        <Figure key={i} x={x} y={y} s={s} kind={k} o={clamp((people - at) * 4)} />
      ))}
    </Svg>
  );
};

/* line 17 → 21: the tunnel and the people in it */
export const SceneTunnel: React.FC<P> = ({ t }) => {
  const people = ramp(t, L("19"), LE("20") - 0.5);
  const cam = lerp(1.25, 1.0, easeIO(ramp(t, L("17"), LE("20"))));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: ramp(t, L("17") - 0.3, L("17") + 0.8) }}>
      <Tunnel t={t} people={people} cam={cam} />
    </div>
  );
};

/* line 21 → 27: the woman in the gray coat */
export const SceneWoman: React.FC<P> = ({ t }) => {
  const step = ease(ramp(t, L("21"), LE("21")));
  const close = easeIO(ramp(t, L("23") - 0.3, L("23") + 0.6));
  const point = ease(ramp(t, L("26") + 1.0, L("26") + 1.8));
  const denial = t >= L("25") && t < L("26");
  const fl = 1 + 0.06 * Math.sin(t * 11);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#050506" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 300px 700px, rgba(255,200,112,${0.2 * fl}), transparent 55%)` }} />
      <Svg style={{ transform: `scale(${lerp(1, 1.25, close)})`, transformOrigin: "540px 820px" }}>
        <g transform={`translate(540 ${lerp(1560, 1620, step)}) scale(${lerp(1.3, 1.8, step)})`} opacity={step}>
          {/* gray coat, long, collar up */}
          <path d="M -80 -360 L 80 -360 L 120 0 L -120 0 Z" fill="#5d6270" />
          <path d="M -80 -360 L 0 -250 L 80 -360 L 64 -380 L 0 -300 L -64 -380 Z" fill="#474b57" />
          <line x1={0} y1={-250} x2={0} y2={0} stroke="#3e424d" strokeWidth={6} />
          {[-200, -140, -80].map((y) => <circle key={y} cx={14} cy={y} r={6} fill="#2c2f38" />)}
          {/* face in shadow, candle edge-light on the left */}
          <ellipse cx={0} cy={-420} rx={46} ry={56} fill="#0a0a0d" />
          <path d="M -46 -420 A 46 56 0 0 1 -10 -474" fill="none" stroke={C.warm} strokeWidth={4} opacity={0.6 * fl} />
          {t > L("23") && <circle cx={-16} cy={-424} r={3.5} fill={C.ink} opacity={0.8} />}
          {t > L("23") && <circle cx={16} cy={-424} r={3.5} fill={C.ink} opacity={0.8} />}
          {/* arm: hangs, then points at the notebook */}
          <g transform={`translate(70 -340) rotate(${lerp(-12, -78, point)})`}>
            <rect x={-14} y={0} width={28} height={190} rx={12} fill="#5d6270" />
            <circle cx={0} cy={198} r={14} fill="#1a1a1e" />
          </g>
        </g>
        {/* Mark's notebook at the bottom of the frame */}
        {point > 0 && (
          <g opacity={point} transform="translate(760 1380) rotate(-8)">
            <rect x={0} y={0} width={240} height={300} rx={10} fill="#2b2620" />
            <rect x={14} y={14} width={212} height={272} rx={6} fill="#3a3229" />
          </g>
        )}
      </Svg>
      {denial && <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 300px rgba(229,36,59,${0.3})` }} />}
    </div>
  );
};

/* line 27 → silence: the page */
export const SceneReveal: React.FC<P> = ({ t }) => {
  const open = ease(ramp(t, L("27") - 0.1, L("27") + 0.7));
  const s = L("29"), e = LE("29");
  const parts = [0.12, 0.42, 0.72, 1].map((f, i, a) => ramp(t, s + (i ? a[i - 1] : 0) * (e - s), s + f * (e - s)));
  const date = ramp(t, L("30") + 1.0, LE("30") + 0.2);
  const zoom = easeIO(ramp(t, L("31") - 0.1, L("31") + 0.5));
  const hit = t > L("31") ? Math.exp(-(t - L("31")) * 5) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#08090e", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1, 2.1, zoom) + hit * 0.05})`, transformOrigin: "640px 960px", opacity: open }}>
        <div style={{ position: "absolute", inset: 0, transform: `perspective(1600px) rotateY(${lerp(-70, 0, open)}deg)`, transformOrigin: "70px 800px" }}>
          <StrangePage write={t < L("29") ? [0, 0, 0, 0] : parts} date={date} />
        </div>
      </div>
      {hit > 0 && <div style={{ position: "absolute", inset: 0, background: C.red, opacity: hit * 0.35, mixBlendMode: "screen" }} />}
    </div>
  );
};

/* End card */
export const EndCard4: React.FC<P> = ({ t }) => {
  const s = T.endCardStart;
  const k = ease(ramp(t, s, s + 0.6));
  const k2 = ease(ramp(t, s + 0.5, s + 1.1));
  const k3 = ease(ramp(t, s + 1.0, s + 1.6));
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 38%, #1A1F33 0%, ${C.bg} 62%)` }}>
      <div style={{ position: "absolute", top: 520, width: W, textAlign: "center", fontFamily: F.body, fontWeight: 800, fontSize: 40, letterSpacing: 8, color: C.sub, opacity: k }}>
        BLACKOUT · PART 5
      </div>
      <div style={{ position: "absolute", top: 610, width: W, textAlign: "center", fontFamily: F.display, fontSize: 150, lineHeight: 1.02, letterSpacing: 4, color: C.ink, opacity: k, transform: `translateY(${lerp(30, 0, k)}px)` }}>
        WHAT I SAW
        <br />
        <span style={{ color: C.red }}>ON DAY ONE</span>
      </div>
      <div style={{ position: "absolute", top: 1000, width: W, display: "flex", justifyContent: "center", opacity: k2 }}>
        <div style={{ padding: "14px 34px", borderRadius: 14, background: C.red, fontFamily: F.body, fontWeight: 800, fontSize: 44, letterSpacing: 4, color: "#fff" }}>
          FOLLOW FOR PART 5
        </div>
      </div>
      <div style={{ position: "absolute", top: 1110, width: W, textAlign: "center", fontFamily: F.body, fontWeight: 700, fontSize: 36, letterSpacing: 6, color: C.sub, opacity: k3 }}>
        SO YOU DON'T FORGET EITHER
      </div>
    </div>
  );
};
