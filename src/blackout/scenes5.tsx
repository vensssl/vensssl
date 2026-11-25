import React from "react";
import { random } from "remotion";
import { Tunnel } from "./scenes4";
import { C, F, L, LE, T, clamp, ease, easeIO, lerp, ramp } from "./theme5";

type P = { t: number };
const W = 1080;
const H = 1920;
const COAT = "#5d6270";
const COAT_DARK = "#474b57";

const Svg: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, ...style }}>
    {children}
  </svg>
);

/* ---------- the phone, held flat in the candlelight ---------- */
const Phone: React.FC<{ on: number; charge: number; thumb: number; play?: number }> = ({ on, charge, thumb, play = 0 }) => (
  <div style={{ position: "absolute", left: 250, top: 470, width: 580, height: 1120, borderRadius: 70, background: "#0c0d12", boxShadow: "0 50px 140px rgba(0,0,0,.9), inset 0 0 0 6px #23252e" }}>
    <div style={{ position: "absolute", inset: 22, borderRadius: 52, background: "#020203", overflow: "hidden" }}>
      {/* boot glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 40%, #1b2440, #06070c 70%)", opacity: on }} />
      {/* battery */}
      {charge > 0 && thumb < 1 && (
        <div style={{ position: "absolute", left: 180, top: 380, width: 176, height: 84, border: `6px solid ${C.ink}`, borderRadius: 14, opacity: on * (1 - thumb) }}>
          <div style={{ position: "absolute", left: 6, top: 6, bottom: 6, width: `${clamp(charge) * 140}px`, background: charge < 0.3 ? C.red : "#4fd17a", borderRadius: 6 }} />
          <div style={{ position: "absolute", right: -20, top: 22, width: 12, height: 28, background: C.ink, borderRadius: 3 }} />
        </div>
      )}
      {/* the last video: a lit skyline thumbnail */}
      {thumb > 0 && (
        <div style={{ position: "absolute", left: 40, right: 40, top: 300, height: 420, borderRadius: 22, overflow: "hidden", opacity: thumb, transform: `scale(${lerp(0.9, 1, thumb)})` }}>
          <svg width={456} height={420} viewBox="0 0 456 420">
            <rect width={456} height={420} fill="#0e1530" />
            {[[10, 220, 60], [80, 160, 70], [160, 240, 50], [220, 120, 80], [310, 200, 60], [380, 170, 70]].map(([x, y, w], i) => (
              <g key={i}>
                <rect x={x} y={y} width={w} height={420 - y} fill="#141a30" />
                {Array.from({ length: Math.floor((420 - y) / 24) }).map((_, r) =>
                  Array.from({ length: Math.floor(w / 18) }).map((__, c) =>
                    random(`th${i}${r}${c}`) > 0.35 ? <rect key={`${r}${c}`} x={x + 5 + c * 18} y={y + 8 + r * 24} width={8} height={12} fill={C.warm} opacity={0.8} /> : null,
                  ),
                )}
              </g>
            ))}
          </svg>
          {/* play button */}
          <div style={{ position: "absolute", left: 188, top: 170, width: 80, height: 80, borderRadius: 40, background: "rgba(0,0,0,.55)", transform: `scale(${1 - play * 0.2})` }}>
            <div style={{ position: "absolute", left: 30, top: 22, borderLeft: "30px solid #fff", borderTop: "18px solid transparent", borderBottom: "18px solid transparent" }} />
          </div>
        </div>
      )}
      {thumb > 0 && (
        <div style={{ position: "absolute", left: 40, right: 40, top: 750, fontFamily: F.body, fontWeight: 800, fontSize: 40, color: C.ink, opacity: thumb, letterSpacing: 2 }}>
          DAY 1 · 9:14 PM
          <div style={{ fontWeight: 700, fontSize: 30, color: C.sub, marginTop: 10, letterSpacing: 1 }}>0:47 · last recorded</div>
        </div>
      )}
    </div>
    {/* cable */}
    {charge > 0 && <div style={{ position: "absolute", left: 270, top: 1120, width: 40, height: 400, background: "#e8e6df", borderRadius: 10 }} />}
  </div>
);

/* 0 → line 04: a dead phone, the charger, the last video */
export const SceneHook: React.FC<P> = ({ t }) => {
  const charge = ramp(t, LE("02") - 0.2, LE("02") + 1.4);
  const on = ease(ramp(t, LE("02"), LE("02") + 0.3));
  const thumb = ease(ramp(t, L("03") + 0.4, L("03") + 0.9));
  const play = ramp(t, LE("03"), LE("03") + 0.15);
  const buzz = t < 1.0 ? Math.sin(t * 160) * 6 * (Math.floor(t / 0.35) % 2 === 0 ? 1 : 0) : 0;
  const push = lerp(1, 1.1, easeIO(ramp(t, 0, L("04"))));
  const fl = 1 + 0.06 * Math.sin(t * 11);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#07070a", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 220px 380px, rgba(255,200,112,${0.18 * fl}), transparent 50%)` }} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push}) translateX(${buzz}px) rotate(-4deg)`, transformOrigin: "540px 1000px" }}>
        <Phone on={on} charge={charge} thumb={thumb} play={play} />
      </div>
      {/* screen light on the dark */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 540px 1000px, rgba(120,150,255,.12), transparent 55%)", opacity: on }} />
    </div>
  );
};

/* line 04 → 08: recap. City dark, the tunnel, the woman, the phone again */
export const SceneRecap: React.FC<P> = ({ t }) => {
  if (t < L("05")) {
    const k = ramp(t, L("04"), LE("04"));
    return (
      <Svg>
        <rect width={W} height={H} fill="#05060a" />
        {[[0, 900, 220], [200, 700, 180], [360, 520, 200], [540, 760, 170], [700, 600, 220], [900, 820, 180]].map(([x, y, w], b) => (
          <rect key={b} x={x} y={y + 40 * (1 - k)} width={w} height={H - y} fill="#0f121c" />
        ))}
        <rect y={1300} width={W} height={620} fill="#04050a" />
        {/* one red dot per door: the list */}
        {Array.from({ length: 22 }).map((_, i) => (
          <circle key={i} cx={60 + random(`rx${i}`) * 960} cy={800 + random(`ry${i}`) * 480} r={7} fill={C.red} opacity={clamp((k * 22 - i) * 0.6)} />
        ))}
      </Svg>
    );
  }
  if (t < L("07")) {
    const k = ramp(t, L("05"), LE("06"));
    const woman = ease(ramp(t, L("06") + 0.6, L("06") + 1.4));
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <Tunnel t={t} people={0} cam={lerp(1.2, 1.05, easeIO(k))} />
        <Svg>
          <g transform={`translate(540 1500) scale(${lerp(1.5, 1.7, k)})`} opacity={woman}>
            <path d="M -80 -360 L 80 -360 L 120 0 L -120 0 Z" fill={COAT} />
            <path d="M -80 -360 L 0 -250 L 80 -360 L 64 -380 L 0 -300 L -64 -380 Z" fill={COAT_DARK} />
            <ellipse cx={0} cy={-420} rx={46} ry={56} fill="#0a0a0d" />
            <path d="M -46 -420 A 46 56 0 0 1 -10 -474" fill="none" stroke={C.warm} strokeWidth={4} opacity={0.6} />
          </g>
        </Svg>
      </div>
    );
  }
  // line 07: the phone again, the video thumbnail, his thumb hesitating
  const k = ease(ramp(t, L("07"), L("07") + 0.4));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#07070a", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1.25, 1.4, ramp(t, L("07"), L("08")))}) rotate(-4deg)`, transformOrigin: "540px 820px", opacity: k }}>
        <Phone on={1} charge={1} thumb={1} play={ramp(t, LE("07"), LE("07") + 0.3)} />
      </div>
      <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 300px rgba(229,36,59,${0.12 + 0.08 * Math.sin(t * 5)})` }} />
    </div>
  );
};

/* ---------- inside the phone video ---------- */
type Bld = { x: number; w: number; top: number; depth: number; id: number };
const SKYLINE: Bld[] = (() => {
  const out: Bld[] = [];
  // three depth bands: far (small, high horizon), middle, near (big, low)
  const bands = [
    { n: 11, y0: 760, hMin: 80, hMax: 300, wMin: 60, wMax: 110, depth: 0 },
    { n: 8, y0: 900, hMin: 160, hMax: 420, wMin: 100, wMax: 160, depth: 1 },
    { n: 5, y0: 1080, hMin: 220, hMax: 520, wMin: 160, wMax: 260, depth: 2 },
  ];
  let id = 0;
  bands.forEach((b) => {
    for (let i = 0; i < b.n; i++) {
      const w = lerp(b.wMin, b.wMax, random(`bw${id}`));
      const x = (i / b.n) * (W + 120) - 60 + random(`bx${id}`) * 40;
      out.push({ x, w, top: b.y0 - lerp(b.hMin, b.hMax, random(`bh${id}`)), depth: b.depth, id });
      id++;
    }
  });
  return out;
})();
/** order of shutdown 0..1: north (left) first, far before near, the camera's roof last */
const offAt = (b: Bld) => clamp((b.depth * 0.32 + (b.x / W) * 0.3 + random(`bo${b.id}`) * 0.06) / 0.98);

const Skyline: React.FC<{ wave: number; t: number }> = ({ wave, t }) => (
  <Svg>
    <defs>
      <linearGradient id="sky5" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#060914" />
        <stop offset="1" stopColor={wave < 1 ? "#1d2442" : "#080a12"} />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill="url(#sky5)" />
    {/* city glow on the clouds, dying with the wave */}
    <ellipse cx={540} cy={820} rx={900} ry={260} fill={C.warm} opacity={0.12 * (1 - wave)} />
    {SKYLINE.map((b) => {
      const off = wave >= offAt(b);
      const flick = !off && wave > offAt(b) - 0.03 && random(`fk${b.id}${Math.floor(t * 20)}`) > 0.5;
      const shade = ["#121729", "#0f1322", "#0b0e19"][b.depth];
      const cell = [18, 24, 32][b.depth];
      return (
        <g key={b.id}>
          <rect x={b.x} y={b.top} width={b.w} height={1300 - b.top} fill={shade} />
          {!off && !flick &&
            Array.from({ length: Math.floor((1240 - b.top) / (cell * 1.5)) }).map((_, r) =>
              Array.from({ length: Math.floor((b.w - 8) / cell) }).map((__, c) =>
                random(`win${b.id}${r}${c}`) > 0.38 ? (
                  <rect key={`${r}${c}`} x={b.x + 6 + c * cell} y={b.top + 10 + r * cell * 1.5} width={cell * 0.5} height={cell * 0.75} fill={C.warm} opacity={0.65 + 0.3 * random(`wo${b.id}${r}`)} />
                ) : null,
              ),
            )}
        </g>
      );
    })}
    {/* the roof the camera stands on, with its own work light */}
    <polygon points={`0,1300 ${W},1240 ${W},${H} 0,${H}`} fill="#0a0b10" />
    <rect x={0} y={1290} width={W} height={14} fill="#191c26" transform="rotate(-3.2 540 1290)" />
    {wave < 1 && <circle cx={880} cy={1340} r={160} fill={C.warm} opacity={0.05} />}
    {wave < 1 && <rect x={860} y={1320} width={40} height={24} rx={4} fill="#fff1cf" />}
  </Svg>
);

/* Six people in gray coats on the roof, lit only by the phone */
const RoofCrew: React.FC<{ t: number; mark: number }> = ({ t, mark }) => {
  const xs = [150, 300, 450, 640, 800, 950];
  return (
    <Svg>
      <rect width={W} height={H} fill="#05060b" />
      <rect y={1250} width={W} height={670} fill="#0a0b10" />
      <ellipse cx={540} cy={1250} rx={700} ry={500} fill="#8ea6ff" opacity={0.06} />
      {xs.map((x, i) => {
        const s = 1.05 + (i % 2) * 0.12;
        const sway = Math.sin(t * 1.3 + i) * 3;
        return (
          <g key={i} transform={`translate(${x + sway} 1330) scale(${s})`}>
            <path d="M -70 -360 L 70 -360 L 100 0 L -100 0 Z" fill={COAT} />
            <path d="M -70 -360 L 0 -260 L 70 -360 L 56 -378 L 0 -300 L -56 -378 Z" fill={COAT_DARK} />
            <line x1={0} y1={-260} x2={0} y2={0} stroke="#3e424d" strokeWidth={5} />
            <ellipse cx={0} cy={-420} rx={42} ry={52} fill="#0a0a0d" />
            {/* the phone light catches their eyes */}
            <circle cx={-14} cy={-424} r={3.5} fill={C.ink} opacity={0.7} />
            <circle cx={14} cy={-424} r={3.5} fill={C.ink} opacity={0.7} />
          </g>
        );
      })}
      {/* her: circled, the way Mark circles things in his notebook */}
      {mark > 0 && (
        <ellipse cx={640} cy={1080} rx={150} ry={330} fill="none" stroke={C.red} strokeWidth={9} strokeDasharray={1600} strokeDashoffset={1600 * (1 - mark)} transform="rotate(-6 640 1080)" />
      )}
    </Svg>
  );
};

/* Selfie view: Mark, in the same gray coat */
const Selfie: React.FC<{ t: number; reveal: number }> = ({ t, reveal }) => (
  <Svg>
    <rect width={W} height={H} fill="#04050a" />
    <g transform="translate(540 1640) scale(2.6)">
      <path d="M -150 0 L -120 -200 L 120 -200 L 150 0 Z" fill={COAT} />
      <path d="M -120 -200 L 0 -90 L 120 -200 L 100 -235 L 0 -140 L -100 -235 Z" fill={COAT_DARK} />
      <rect x={-34} y={-260} width={68} height={70} fill="#0d0d11" />
      <ellipse cx={0} cy={-330} rx={78} ry={96} fill="#0d0e13" />
      {/* phone light from below */}
      <path d="M -78 -330 A 78 96 0 0 0 78 -330" fill="none" stroke="#9fb4ff" strokeWidth={5} opacity={0.5 * reveal} />
      <circle cx={-26} cy={-334} r={6} fill={C.ink} opacity={0.85 * reveal} />
      <circle cx={26} cy={-334} r={6} fill={C.ink} opacity={0.85 * reveal} />
    </g>
    <circle cx={0} cy={0} r={0} opacity={t * 0} />
  </Svg>
);

/* Phone-camera chrome over the video: REC, timecode, battery, scanline */
const PhoneUI: React.FC<{ t: number; start: number; frozen?: boolean }> = ({ t, start, frozen }) => {
  const secs = 14 * 60 + Math.floor(t - start);
  const tc = `21:${String(Math.floor(secs / 60) % 60).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <>
      <div style={{ position: "absolute", left: 80, top: 390, display: "flex", gap: 14, alignItems: "center", fontFamily: F.body, fontWeight: 800, fontSize: 32, color: C.ink, letterSpacing: 2 }}>
        <div style={{ width: 22, height: 22, borderRadius: 11, background: C.red, opacity: frozen || Math.floor(t * 2) % 2 ? 1 : 0.25 }} />
        {frozen ? "PAUSED" : "REC"}
      </div>
      <div style={{ position: "absolute", right: 210, top: 390, fontFamily: F.body, fontWeight: 700, fontSize: 32, color: C.ink, letterSpacing: 2, opacity: 0.9 }}>{tc}</div>
      <div style={{ position: "absolute", left: 80, right: 80, top: 450, bottom: 420, border: "3px solid rgba(242,240,234,.25)", borderRadius: 18 }} />
    </>
  );
};

/* line 08 → 21: the video from day one */
export const SceneVideo: React.FC<P> = ({ t }) => {
  const start = L("08") - 0.2;
  const shakeX = Math.sin(t * 2.1) * 6 + Math.sin(t * 5.3) * 3;
  const shakeY = Math.cos(t * 1.7) * 5 + Math.sin(t * 4.1) * 2;
  const wave = ramp(t, L("12") + 0.9, L("15") + 0.15);
  const flipAt = L("16") + 1.3;
  const selfieAt = L("19") + 0.2;
  let body: React.ReactNode;
  let blur = 0;
  if (t < flipAt) {
    const zoom = lerp(1.0, 1.12, easeIO(ramp(t, start, flipAt)));
    body = (
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})` }}>
        <Skyline wave={wave} t={t} />
      </div>
    );
  } else if (t < selfieAt) {
    const pan = ease(ramp(t, flipAt, flipAt + 0.45));
    blur = 30 * (1 - pan);
    body = (
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${lerp(-900, 0, pan)}px)` }}>
        <RoofCrew t={t} mark={ramp(t, L("18") + 0.2, LE("18") + 0.2)} />
      </div>
    );
  } else {
    const turn = ease(ramp(t, selfieAt, selfieAt + 0.5));
    const reveal = ramp(t, L("20") - 0.1, L("20") + 0.3);
    blur = 24 * (1 - turn);
    body = (
      <div style={{ position: "absolute", inset: 0, transform: `scaleX(-1) translateX(${lerp(600, 0, turn)}px) scale(${lerp(1, 1.12, reveal)})`, transformOrigin: "540px 900px" }}>
        <Selfie t={t} reveal={reveal} />
      </div>
    );
  }
  const frozen = t >= L("20");
  const hit = t > L("20") ? Math.exp(-(t - L("20")) * 5) : 0;
  const s = frozen ? 0 : 1;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: -40, transform: `translate(${shakeX * s}px, ${shakeY * s}px)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>{body}</div>
      {/* cheap phone sensor: cool tint + scanlines */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(40,70,140,.12)", mixBlendMode: "screen" }} />
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(transparent 0 3px, rgba(0,0,0,.18) 3px 4px)" }} />
      <PhoneUI t={t} start={start} frozen={frozen} />
      {hit > 0 && <div style={{ position: "absolute", inset: 0, background: C.red, opacity: hit * 0.4, mixBlendMode: "screen" }} />}
    </div>
  );
};

/* The list, in Mark's own pencil */
const TheList: React.FC<{ write: number; strike: number }> = ({ write, strike }) => {
  const rows = ["4A  Hendricks", "5C  Okafor", "6A  The Brennans", "6C  Lin", "7B  Alvarez, D.", "7D  Moretti"];
  return (
    <div
      style={{
        position: "absolute", left: 90, top: 400, width: 900, height: 860, transform: "rotate(3deg)", boxShadow: "0 40px 100px rgba(0,0,0,.85)",
        background: "#cfc8b8",
        backgroundImage: "linear-gradient(90deg, transparent 110px, rgba(229,36,59,.55) 110px 114px, transparent 114px), repeating-linear-gradient(transparent 0 118px, rgba(60,80,140,.28) 118px 121px)",
      }}
    >
      <div style={{ position: "absolute", left: 140, top: 40, fontFamily: F.pencil, fontSize: 82, color: "#1f2230", lineHeight: "121px" }}>
        {rows.map((r, i) => {
          const k = clamp(write * rows.length - i);
          return (
            <div key={i} style={{ position: "relative", whiteSpace: "nowrap", clipPath: `inset(0 ${100 - k * 100}% 0 0)` }}>
              {r}
              <div style={{ position: "absolute", left: -10, top: 62, height: 7, width: `${clamp(strike * rows.length - i) * 600}px`, background: C.red, transform: "rotate(-2deg)" }} />
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", right: 60, bottom: 30, fontFamily: F.pencil, fontSize: 110, color: "#1f2230", opacity: clamp(write * 1.4 - 0.4), transform: "rotate(-6deg)" }}>— M.</div>
    </div>
  );
};

/* line 21 → 24: her face, then the list */
export const SceneTruth: React.FC<P> = ({ t }) => {
  if (t < L("23") - 0.15) {
    const close = easeIO(ramp(t, L("21"), LE("22")));
    const fl = 1 + 0.06 * Math.sin(t * 11);
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#050506" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 300px 700px, rgba(255,200,112,${0.2 * fl}), transparent 55%)` }} />
        <Svg style={{ transform: `scale(${lerp(1, 1.3, close)})`, transformOrigin: "540px 760px" }}>
          <g transform="translate(540 1700) scale(2.4)">
            <path d="M -80 -360 L 80 -360 L 120 0 L -120 0 Z" fill={COAT} />
            <path d="M -80 -360 L 0 -250 L 80 -360 L 64 -380 L 0 -300 L -64 -380 Z" fill={COAT_DARK} />
            <ellipse cx={0} cy={-420} rx={46} ry={56} fill="#0a0a0d" />
            <path d="M -46 -420 A 46 56 0 0 1 -10 -474" fill="none" stroke={C.warm} strokeWidth={3} opacity={0.6 * fl} />
            <circle cx={-16} cy={-424} r={3} fill={C.ink} opacity={0.85} />
            <circle cx={16} cy={-424} r={3} fill={C.ink} opacity={0.85} />
          </g>
        </Svg>
      </div>
    );
  }
  const write = ramp(t, L("23") - 0.15, LE("23") + 0.4);
  const strike = ramp(t, LE("23") + 0.2, L("24") + 0.1);
  const hit = t > L("23") ? Math.exp(-(t - L("23")) * 4) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#08090e", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${1.05 + hit * 0.05})` }}>
        <TheList write={write} strike={strike} />
      </div>
      {hit > 0 && <div style={{ position: "absolute", inset: 0, background: C.red, opacity: hit * 0.25, mixBlendMode: "screen" }} />}
    </div>
  );
};

/* line 24 → 28: looking up the shaft as the grate opens and the lights come down */
export const SceneShaft: React.FC<P> = ({ t }) => {
  const open = ease(ramp(t, L("24") + 0.8, L("24") + 1.8));
  const beams = ramp(t, L("25"), L("25") + 0.8);
  const figure = ease(ramp(t, L("26") + 0.6, L("26") + 1.6));
  const speak = t >= L("27") && t < LE("27") + 0.3;
  const push = lerp(1, 1.25, easeIO(ramp(t, L("24"), LE("27"))));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>
      <Svg style={{ transform: `scale(${push})`, transformOrigin: "540px 760px" }}>
        <defs>
          <linearGradient id="beam5" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff6dc" stopOpacity={0.55} />
            <stop offset="1" stopColor="#fff6dc" stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* shaft walls receding up toward the opening */}
        {Array.from({ length: 12 }).map((_, i) => {
          const d = i / 12, s = 1 - d * 0.75;
          return <rect key={i} x={540 - 520 * s} y={760 - 600 * s} width={1040 * s} height={1200 * s} fill="none" stroke={`rgba(80,60,50,${0.6 * (1 - d)})`} strokeWidth={10 * s} />;
        })}
        {/* ladder rungs going up */}
        {Array.from({ length: 10 }).map((_, i) => {
          const s = 1 - (i / 10) * 0.72;
          return <rect key={`r${i}`} x={540 - 200 * s} y={760 + 700 * s} width={400 * s} height={16 * s} rx={5} fill={`rgba(120,80,60,${0.8 * s})`} />;
        })}
        {/* the opening: street light, the grate sliding away */}
        <rect x={410} y={460} width={260} height={150} fill="#1a1d28" />
        <rect x={410} y={460} width={260} height={150} fill="#cfd6e8" opacity={0.25 * open + 0.4 * beams} />
        <g transform={`translate(${open * 280} 0)`}>
          {Array.from({ length: 7 }).map((_, i) => <rect key={i} x={418 + i * 36} y={460} width={14} height={150} fill="#2e3344" />)}
        </g>
        {/* silhouette leaning over the edge */}
        {figure > 0 && (
          <g transform={`translate(540 ${lerp(450, 560, figure)})`} opacity={figure}>
            <ellipse cx={0} cy={0} rx={40} ry={48} fill="#030306" />
            <path d="M -90 50 L 90 50 L 70 -10 L -70 -10 Z" fill="#030306" />
          </g>
        )}
        {/* flashlight beams pouring down */}
        {beams > 0 &&
          [-1, 0, 1].map((k) => {
            const sw = Math.sin(t * 1.6 + k * 2) * 160;
            return (
              <polygon key={k} points={`${520 + k * 50},560 ${560 + k * 50},560 ${540 + sw + k * 260 + 220},${H} ${540 + sw + k * 260 - 220},${H}`} fill="url(#beam5)" opacity={beams * (0.7 + 0.3 * Math.sin(t * 7 + k))} />
            );
          })}
      </Svg>
      {speak && <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 300px rgba(229,36,59,${0.2 + 0.1 * Math.sin(t * 6)})` }} />}
    </div>
  );
};

/* line 28 → silence: every face in the tunnel turns, and the ladder up */
export const SceneTurn: React.FC<P> = ({ t }) => {
  if (t < L("29")) {
    const k = ramp(t, L("28"), LE("28"));
    const eyes = Array.from({ length: 18 }, (_, i) => ({
      x: 90 + random(`ex${i}`) * 900,
      y: 700 + random(`ey${i}`) * 700,
      s: 0.6 + random(`es${i}`) * 1.2,
      at: random(`ea${i}`) * 0.8,
    }));
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <Tunnel t={t} people={0} cam={lerp(1.05, 1.2, easeIO(k))} />
        <Svg>
          <rect width={W} height={H} fill="#000" opacity={0.55} />
          {eyes.map((e, i) => {
            const o = clamp((k - e.at) * 6);
            return (
              <g key={i} opacity={o} transform={`translate(${e.x} ${e.y}) scale(${e.s})`}>
                <ellipse cx={0} cy={0} rx={50} ry={60} fill="#050507" />
                <circle cx={-15} cy={-4} r={4} fill={C.ink} />
                <circle cx={15} cy={-4} r={4} fill={C.ink} />
              </g>
            );
          })}
        </Svg>
      </div>
    );
  }
  // looking up the ladder into the light. He knows the way.
  const k = ramp(t, L("29"), T.silenceStart);
  const climb = ((t - L("29")) * 90) % 160;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#020203", overflow: "hidden" }}>
      <Svg style={{ transform: `scale(${lerp(1, 1.3, easeIO(k))})`, transformOrigin: "540px 300px" }}>
        <defs>
          <linearGradient id="up5" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity={0.95} />
            <stop offset="1" stopColor="#e6ecff" stopOpacity={0.35 + 0.25 * k} />
          </linearGradient>
        </defs>
        <rect x={340} y={0} width={18} height={H} fill="#3a2a20" />
        <rect x={722} y={0} width={18} height={H} fill="#3a2a20" />
        {Array.from({ length: 14 }).map((_, i) => (
          <rect key={i} x={340} y={i * 160 - 160 + climb} width={400} height={20} rx={6} fill="#5a3a28" />
        ))}
        <rect width={W} height={H} fill="url(#up5)" />
      </Svg>
      {/* his hand on the next rung */}
      <Svg>
        <g transform={`translate(${lerp(560, 600, k)} ${lerp(1500, 1420, ease(k))})`}>
          <path d="M -60 0 L 60 0 L 90 420 L -90 420 Z" fill={COAT_DARK} opacity={0.75} />
          <path d="M -50 -30 Q 0 -60 50 -30 L 56 10 L -56 10 Z" fill="#0d0e13" />
        </g>
      </Svg>
    </div>
  );
};

/* End card */
export const EndCard5: React.FC<P> = ({ t }) => {
  const s = T.endCardStart;
  const k = ease(ramp(t, s, s + 0.6));
  const k2 = ease(ramp(t, s + 0.5, s + 1.1));
  const k3 = ease(ramp(t, s + 1.0, s + 1.6));
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 38%, #1A1F33 0%, ${C.bg} 62%)` }}>
      <div style={{ position: "absolute", top: 520, width: W, textAlign: "center", fontFamily: F.body, fontWeight: 800, fontSize: 40, letterSpacing: 8, color: C.sub, opacity: k }}>
        BLACKOUT · PART 6
      </div>
      <div style={{ position: "absolute", top: 610, width: W, textAlign: "center", fontFamily: F.display, fontSize: 150, lineHeight: 1.02, letterSpacing: 4, color: C.ink, opacity: k, transform: `translateY(${lerp(30, 0, k)}px)` }}>
        WHY I
        <br />
        <span style={{ color: C.red }}>WROTE IT</span>
      </div>
      <div style={{ position: "absolute", top: 1000, width: W, display: "flex", justifyContent: "center", opacity: k2 }}>
        <div style={{ padding: "14px 34px", borderRadius: 14, background: C.red, fontFamily: F.body, fontWeight: 800, fontSize: 44, letterSpacing: 4, color: "#fff" }}>
          FOLLOW FOR PART 6
        </div>
      </div>
      <div style={{ position: "absolute", top: 1110, width: W, textAlign: "center", fontFamily: F.body, fontWeight: 700, fontSize: 36, letterSpacing: 6, color: C.sub, opacity: k3 }}>
        BEFORE I REMEMBER THE REST
      </div>
    </div>
  );
};

export const _unused = { lerp, LE };
