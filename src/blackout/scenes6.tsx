import React from "react";
import { random } from "remotion";
import { PhoneUI, Skyline } from "./scenes5";
import { C, F, L, LE, T, clamp, ease, easeIO, lerp, ramp } from "./theme6";

type P = { t: number };
const W = 1080;
const H = 1920;
const COAT = "#5d6270";
const COAT_DARK = "#474b57";
const HEAD = "#0a0a0d";

export const Svg: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, ...style }}>
    {children}
  </svg>
);

export const PAPER = {
  background: "#cfc8b8",
  backgroundImage:
    "linear-gradient(90deg, transparent 110px, rgba(229,36,59,.55) 110px 114px, transparent 114px), repeating-linear-gradient(transparent 0 118px, rgba(60,80,140,.28) 118px 121px)",
} as const;

// Alvarez, D. (the grandson) is the last name Mark wrote
const NAMES = ["4A  Hendricks", "5C  Okafor", "6A  The Brennans", "6C  Lin", "7D  Moretti", "7B  Alvarez, D."];

/** Mark's list, in pencil. write/strike 0..1 sweep row by row; circle rings the last name. */
export const List: React.FC<{ write: number; strike: number; circle?: number; dim?: number; style?: React.CSSProperties }> = ({ write, strike, circle = 0, dim = 0, style }) => (
  <div style={{ position: "absolute", left: 90, top: 420, width: 900, height: 860, transform: "rotate(3deg)", boxShadow: "0 40px 100px rgba(0,0,0,.85)", ...PAPER, ...style }}>
    <div style={{ position: "absolute", left: 140, top: 40, fontFamily: F.pencil, fontSize: 82, color: "#1f2230", lineHeight: "121px" }}>
      {NAMES.map((r, i) => {
        const k = clamp(write * NAMES.length - i);
        return (
          <div key={i} style={{ position: "relative", whiteSpace: "nowrap", clipPath: `inset(0 ${100 - k * 100}% 0 0)` }}>
            {r}
            <div style={{ position: "absolute", left: -10, top: 62, height: 7, width: `${clamp(strike * NAMES.length - i) * 600}px`, background: C.red, transform: "rotate(-2deg)" }} />
          </div>
        );
      })}
    </div>
    {circle > 0 && (
      <svg width={900} height={860} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={420} cy={700} rx={330} ry={70} fill="none" stroke={C.red} strokeWidth={8} strokeDasharray={1700} strokeDashoffset={1700 * (1 - circle)} transform="rotate(-3 420 700)" />
      </svg>
    )}
    {dim > 0 && <div style={{ position: "absolute", inset: 0, background: "#000", opacity: dim }} />}
  </div>
);

/** A figure in a gray coat. eyes: 0 = dark, 1 = lit from inside. */
export const Coat: React.FC<{ x: number; y: number; s: number; eyes?: number; rim?: number; veins?: number; o?: number }> = ({ x, y, s, eyes = 0, rim = 0, veins = 0, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d="M -80 -360 L 80 -360 L 120 0 L -120 0 Z" fill={COAT} />
    <path d="M -80 -360 L 0 -250 L 80 -360 L 64 -380 L 0 -300 L -64 -380 Z" fill={COAT_DARK} />
    <line x1={0} y1={-250} x2={0} y2={0} stroke="#3e424d" strokeWidth={5} />
    <rect x={-18} y={-400} width={36} height={30} fill={HEAD} />
    <ellipse cx={0} cy={-430} rx={46} ry={56} fill={HEAD} />
    {/* headlights behind him catch the edge of his head */}
    {rim > 0 && <ellipse cx={0} cy={-430} rx={48} ry={58} fill="none" stroke="#fff6dc" strokeWidth={3} opacity={rim} />}
    {veins > 0 &&
      [
        "M -16 -434 L -30 -420 L -30 -400",
        "M -16 -434 L -36 -448 L -36 -466",
        "M 16 -434 L 30 -420 L 30 -396",
        "M 16 -434 L 36 -450 L 40 -468",
        "M -16 -434 L -16 -410 L -6 -396",
        "M 16 -434 L 10 -456 L 10 -476",
      ].map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#ff6b7a" strokeWidth={2.4} strokeDasharray={60} strokeDashoffset={60 * (1 - clamp(veins * 1.6 - i * 0.12))} opacity={0.9} />
      ))}
    {eyes > 0 && (
      <>
        <circle cx={-16} cy={-434} r={26 * eyes} fill={C.red} opacity={0.35 * eyes} />
        <circle cx={16} cy={-434} r={26 * eyes} fill={C.red} opacity={0.35 * eyes} />
        <circle cx={-16} cy={-434} r={5 + 2 * eyes} fill="#fff4f0" opacity={eyes} />
        <circle cx={16} cy={-434} r={5 + 2 * eyes} fill="#fff4f0" opacity={eyes} />
      </>
    )}
  </g>
);

/* 0 → line 03: the list, every name struck out. Then: not one came back. */
export const SceneHook: React.FC<P> = ({ t }) => {
  const strike = ramp(t, L("01") + 0.2, LE("01") - 0.1);
  const slam = t > L("02") ? Math.exp(-(t - L("02")) * 5) : 0;
  const push = lerp(1.02, 1.16, easeIO(ramp(t, 0, L("03"))));
  const dark = ease(ramp(t, L("02") + 0.4, LE("02") + 0.5)) * 0.55;
  const fl = 1 + 0.07 * Math.sin(t * 11) + 0.03 * Math.sin(t * 29);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#07070a", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 260px 360px, rgba(255,200,112,${0.22 * fl * (1 - dark)}), transparent 55%)` }} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push + slam * 0.08}) rotate(${slam * -1.5}deg)`, transformOrigin: "540px 850px" }}>
        <List write={1} strike={strike} dim={dark} />
      </div>
      {slam > 0 && <div style={{ position: "absolute", inset: 0, background: C.red, opacity: slam * 0.35, mixBlendMode: "screen" }} />}
    </div>
  );
};

/* rusty ladder, looking up into street light */
const Ladder: React.FC<{ t: number; k: number }> = ({ t, k }) => {
  const climb = (t * 110) % 160;
  return (
    <Svg style={{ transform: `scale(${lerp(1, 1.25, easeIO(k))})`, transformOrigin: "540px 300px" }}>
      <defs>
        <linearGradient id="up6" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={0.95} />
          <stop offset="1" stopColor="#e6ecff" stopOpacity={0.3 + 0.4 * k} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="#020203" />
      <rect x={340} y={0} width={18} height={H} fill="#3a2a20" />
      <rect x={722} y={0} width={18} height={H} fill="#3a2a20" />
      {Array.from({ length: 14 }).map((_, i) => (
        <rect key={i} x={340} y={i * 160 - 160 + climb} width={400} height={20} rx={6} fill="#5a3a28" />
      ))}
      <rect width={W} height={H} fill="url(#up6)" />
    </Svg>
  );
};

/* line 03 → 06: recap. Dark city, the phone video, the ladder up */
export const SceneRecap: React.FC<P> = ({ t }) => {
  if (t < L("04")) {
    return (
      <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1.08, 1, ramp(t, L("03") - 0.2, L("04")))})` }}>
        <Skyline wave={1} t={t} />
      </div>
    );
  }
  if (t < L("05")) {
    const wave = ramp(t, L("04") + 0.6, LE("04"));
    const shake = Math.sin(t * 2.1) * 6 + Math.sin(t * 5.3) * 3;
    return (
      <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: -40, transform: `translate(${shake}px, ${Math.cos(t * 1.7) * 5}px) scale(1.06)` }}>
          <Skyline wave={wave} t={t} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "rgba(40,70,140,.12)", mixBlendMode: "screen" }} />
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(transparent 0 3px, rgba(0,0,0,.18) 3px 4px)" }} />
        <PhoneUI t={t} start={L("04") - 3} />
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Ladder t={t} k={ramp(t, L("05"), L("06"))} />
    </div>
  );
};

/* the street: a line of white trucks, headlights in our eyes, and him */
export const Street: React.FC<{ t: number; man: number; glare: number; rim?: number; eyes?: number; veins?: number; manScale?: number }> = ({ t, man, glare, rim = 0.7, eyes = 0, veins = 0, manScale = 1.5 }) => (
  <Svg>
    <defs>
      <radialGradient id="hl6">
        <stop offset="0" stopColor="#fffbea" stopOpacity={1} />
        <stop offset="0.25" stopColor="#fff1c4" stopOpacity={0.5} />
        <stop offset="1" stopColor="#fff1c4" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect width={W} height={H} fill="#06070c" />
    {/* dead buildings */}
    {[[0, 380, 260], [240, 520, 220], [470, 300, 200], [660, 460, 240], [880, 350, 200]].map(([x, y, w], i) => (
      <rect key={i} x={x} y={y} width={w} height={1100 - y} fill="#0c0e16" />
    ))}
    <rect y={1100} width={W} height={820} fill="#08090d" />
    {/* wet asphalt reflections */}
    <rect x={260} y={1180} width={560} height={740} fill="#fff1c4" opacity={0.05 * glare} />
    {/* trucks receding: white boxes */}
    {[0, 1, 2, 3].map((i) => {
      const s = 1 - i * 0.22, x = 540 + (i % 2 ? 1 : -1) * 40 * i, y = 1150 - i * 70;
      return (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`} opacity={1 - i * 0.18}>
          <rect x={-300} y={-420} width={600} height={340} fill="#c9ccd1" />
          <rect x={-260} y={-120} width={520} height={110} fill="#8c9098" />
          <rect x={-300} y={-80} width={600} height={40} fill="#3a3d44" />
          <circle cx={-210} cy={-60} r={42} fill="url(#hl6)" opacity={glare} transform={`scale(${1 + 0.02 * Math.sin(t * 9 + i)})`} />
          <circle cx={210} cy={-60} r={42} fill="url(#hl6)" opacity={glare} />
          <ellipse cx={-210} cy={-60} rx={260} ry={120} fill="url(#hl6)" opacity={0.35 * glare} />
          <ellipse cx={210} cy={-60} rx={260} ry={120} fill="url(#hl6)" opacity={0.35 * glare} />
        </g>
      );
    })}
    {/* diesel exhaust drifting through the beams */}
    {Array.from({ length: 6 }).map((_, i) => (
      <ellipse key={i} cx={(i * 230 + t * 25) % 1300 - 100} cy={1040 + 30 * Math.sin(i + t * 0.5)} rx={220} ry={60} fill="#e9e4d4" opacity={0.035} />
    ))}
    <Coat x={540} y={1620} s={manScale} o={man} rim={rim} eyes={eyes} veins={veins} />
  </Svg>
);

/* line 06 → 08: he's waiting by the trucks */
export const SceneStreet: React.FC<P> = ({ t }) => {
  const man = ease(ramp(t, L("06") + 0.6, L("06") + 1.6));
  const glare = ease(ramp(t, L("06") - 0.3, L("06") + 0.5));
  const push = lerp(1, 1.18, easeIO(ramp(t, L("06"), L("08"))));
  const speak = t >= L("07") && t < LE("07") + 0.2;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "540px 1100px" }}>
        <Street t={t} man={man} glare={glare} />
      </div>
      {speak && <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 300px rgba(229,36,59,${0.18 + 0.08 * Math.sin(t * 6)})` }} />}
    </div>
  );
};

/* line 08 → 11: the badge. My face. My name. */
export const SceneBadge: React.FC<P> = ({ t }) => {
  const k = ease(ramp(t, L("08") - 0.2, L("08") + 0.5));
  const title = ease(ramp(t, L("09") - 0.1, L("09") + 0.6));
  const push = lerp(1, 1.14, easeIO(ramp(t, L("08"), L("11"))));
  const flash = t > L("10") + 1.15 ? Math.exp(-(t - L("10") - 1.15) * 3.5) : 0;
  const flick = 1 + 0.08 * Math.sin(t * 12) + 0.04 * Math.sin(t * 31);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#06070b", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 540px 500px, rgba(255,241,196,${0.14 * flick}), transparent 60%)` }} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push}) translateY(${lerp(200, 0, k)}px) rotate(-5deg)`, transformOrigin: "540px 900px", opacity: k }}>
        {/* lanyard */}
        <div style={{ position: "absolute", left: 520, top: 0, width: 40, height: 470, background: C.red, opacity: 0.85 }} />
        <div style={{ position: "absolute", left: 170, top: 460, width: 740, height: 900, borderRadius: 34, background: "#e8e6df", boxShadow: "0 40px 120px rgba(0,0,0,.9)", overflow: "hidden" }}>
          <div style={{ height: 170, background: "#161b2c", display: "flex", alignItems: "center", gap: 22, padding: "0 46px" }}>
            {/* grid logo: a lightning bolt in a square */}
            <svg width={86} height={86} viewBox="0 0 86 86">
              <rect x={3} y={3} width={80} height={80} rx={14} fill="none" stroke={C.warm} strokeWidth={6} />
              <path d="M 48 14 L 24 48 L 42 48 L 36 74 L 62 36 L 44 36 Z" fill={C.warm} />
            </svg>
            <div style={{ fontFamily: F.body, fontWeight: 800, fontSize: 40, letterSpacing: 3, color: C.ink, lineHeight: 1.1 }}>
              CITY GRID
              <br />
              CONTROL
            </div>
          </div>
          {/* photo: Mark */}
          <div style={{ position: "absolute", left: 46, top: 220, width: 300, height: 380, background: "#9aa0ad", borderRadius: 10, overflow: "hidden" }}>
            <svg width={300} height={380} viewBox="0 0 300 380">
              <path d="M 20 380 L 50 290 L 250 290 L 280 380 Z" fill={COAT} />
              <path d="M 50 290 L 150 350 L 250 290 L 230 270 L 150 320 L 70 270 Z" fill={COAT_DARK} />
              <rect x={126} y={230} width={48} height={50} fill="#2a2c33" />
              <ellipse cx={150} cy={170} rx={70} ry={88} fill="#2a2c33" />
              <circle cx={126} cy={168} r={6} fill="#cfd3dc" />
              <circle cx={174} cy={168} r={6} fill="#cfd3dc" />
            </svg>
          </div>
          <div style={{ position: "absolute", left: 380, top: 240, fontFamily: F.display, fontSize: 120, color: "#14161d", letterSpacing: 2, lineHeight: 1 }}>MARK</div>
          <div style={{ position: "absolute", left: 384, top: 380, fontFamily: F.body, fontWeight: 700, fontSize: 30, color: "#4a4f5c", letterSpacing: 2 }}>ID 0914-N</div>
          <div style={{ position: "absolute", left: 46, right: 46, top: 650, padding: "18px 0", background: C.red, color: "#fff", textAlign: "center", fontFamily: F.body, fontWeight: 800, fontSize: 46, letterSpacing: 5, opacity: title, transform: `scale(${lerp(1.15, 1, title)})` }}>
            NIGHT SUPERVISOR
          </div>
          <div style={{ position: "absolute", left: 46, right: 46, bottom: 50, height: 70, background: "repeating-linear-gradient(90deg, #14161d 0 6px, transparent 6px 10px, #14161d 10px 13px, transparent 13px 20px)" }} />
        </div>
      </div>
      {/* the memory comes back as a white-out */}
      {flash > 0 && <div style={{ position: "absolute", inset: 0, background: "#f4f6ff", opacity: flash * 0.9 }} />}
    </div>
  );
};

/* ---------- day one, the control room ---------- */
type Node = { x: number; y: number; id: number };
const HOUSES: Node[] = Array.from({ length: 18 }, (_, i) => ({
  x: 130 + (i % 6) * 164 + random(`hx${i}`) * 40,
  y: 720 + Math.floor(i / 6) * 210 + random(`hy${i}`) * 40,
  id: i,
}));
// infection order: starts top-left, spreads along the wires
const reachAt = (n: Node) => clamp(((n.x - 130) / 900) * 0.55 + ((n.y - 720) / 460) * 0.35 + random(`ra${n.id}`) * 0.1);

/** the city on a control-room screen: houses as lit squares on a wire grid; spread 0..1 turns them red */
export const GridMap: React.FC<{ t: number; spread: number; off?: number }> = ({ t, spread, off = 0 }) => (
  <Svg>
    <rect width={W} height={H} fill="#030812" />
    {/* wires */}
    {[0, 1, 2].map((r) => <line key={`h${r}`} x1={80} x2={1000} y1={760 + r * 210} y2={760 + r * 210} stroke="#1b3a55" strokeWidth={4} />)}
    {[0, 1, 2, 3, 4, 5].map((c) => <line key={`v${c}`} x1={150 + c * 164} x2={150 + c * 164} y1={680} y2={1240} stroke="#1b3a55" strokeWidth={4} />)}
    {/* the thing moving through them: a red pulse per infected house */}
    {HOUSES.map((n) => {
      const r = reachAt(n), on = spread >= r;
      const dead = off >= ((n.x - 130) / 900) * 0.9;
      const pulse = on ? clamp((spread - r) * 8) : 0;
      return (
        <g key={n.id}>
          {on && <circle cx={n.x + 20} cy={n.y + 20} r={20 + 90 * pulse} fill="none" stroke={C.red} strokeWidth={3} opacity={(1 - pulse) * 0.8} />}
          <rect x={n.x} y={n.y} width={44} height={44} rx={4} fill={dead ? "#0b0f18" : on ? C.red : C.warm} opacity={dead ? 1 : on ? 0.75 + 0.25 * Math.sin(t * 9 + n.id) : 0.85} />
        </g>
      );
    })}
  </Svg>
);

/* line 11 → 17: every screen red; it moves through the wires; the people stop being people */
export const SceneControl: React.FC<P> = ({ t }) => {
  if (t < L("12")) {
    // the wall of monitors flipping to red
    const k = ramp(t, L("11") + 0.6, LE("11"));
    const push = lerp(1, 1.1, easeIO(ramp(t, L("11"), L("12"))));
    return (
      <div style={{ position: "absolute", inset: 0, background: "#04050a", overflow: "hidden" }}>
        <Svg style={{ transform: `scale(${push})`, transformOrigin: "540px 900px" }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const cx = i % 3, cy = Math.floor(i / 3);
            const red = k * 12 > [4, 9, 1, 7, 0, 11, 5, 2, 10, 3, 8, 6][i];
            const x = 90 + cx * 310, y = 420 + cy * 260;
            return (
              <g key={i}>
                <rect x={x} y={y} width={280} height={230} rx={8} fill="#111521" />
                <rect x={x + 12} y={y + 12} width={256} height={206} fill={red ? "#4a0b14" : "#082236"} />
                {Array.from({ length: 5 }).map((__, j) => (
                  <rect key={j} x={x + 26} y={y + 30 + j * 36} width={60 + random(`bar${i}${j}`) * 170} height={14} fill={red ? C.red : "#3fa7d6"} opacity={red && Math.floor(t * 4 + i) % 2 ? 0.4 : 0.85} />
                ))}
              </g>
            );
          })}
          {/* the desk and an empty chair, silhouetted */}
          <rect y={1500} width={W} height={420} fill="#020204" />
          <rect x={380} y={1320} width={320} height={200} rx={20} fill="#020204" />
        </Svg>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 540px 800px, rgba(229,36,59,${0.25 * k}), transparent 65%)` }} />
      </div>
    );
  }
  if (t < L("15")) {
    // closer on one screen: it spreads house to house along the wires
    const spread = ramp(t, L("13"), LE("14") + 0.2);
    const push = lerp(1, 1.12, easeIO(ramp(t, L("12"), L("15"))));
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "540px 960px" }}>
          <GridMap t={t} spread={spread} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(transparent 0 3px, rgba(0,0,0,.25) 3px 4px)" }} />
        <div style={{ position: "absolute", left: 90, top: 420, fontFamily: F.body, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: C.red, opacity: Math.floor(t * 2) % 2 ? 1 : 0.4 }}>
          ⚠ GRID ANOMALY · SECTOR N
        </div>
      </div>
    );
  }
  // one lit window. Someone inside, back to us. On "stopped being people", they turn.
  const turn = ease(ramp(t, L("16") - 0.05, L("16") + 0.35));
  const push = lerp(1, 1.3, easeIO(ramp(t, L("15"), L("17"))));
  const hit = t > L("16") ? Math.exp(-(t - L("16")) * 4) : 0;
  const buzz = 0.85 + 0.15 * (random(`wb${Math.floor(t * 18)}`) > 0.2 ? 1 : 0);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#05060a", overflow: "hidden" }}>
      <Svg style={{ transform: `scale(${push})`, transformOrigin: "540px 900px" }}>
        <rect width={W} height={H} fill="#0b0d14" />
        <rect x={240} y={480} width={600} height={800} fill="#1a1712" />
        <rect x={270} y={510} width={540} height={740} fill={C.warm} opacity={0.75 * buzz} />
        <line x1={540} y1={510} x2={540} y2={1250} stroke="#1a1712" strokeWidth={16} />
        <line x1={270} y1={880} x2={810} y2={880} stroke="#1a1712" strokeWidth={16} />
        {/* the person: head and shoulders */}
        <g transform="translate(540 1250)">
          <path d="M -200 0 Q -190 -250 0 -260 Q 190 -250 200 0 Z" fill="#1d1a14" />
          <ellipse cx={0} cy={-370} rx={95} ry={115} fill="#1d1a14" />
          {turn > 0 && (
            <>
              <circle cx={-34} cy={-376} r={30 * turn} fill={C.red} opacity={0.4 * turn} />
              <circle cx={34} cy={-376} r={30 * turn} fill={C.red} opacity={0.4 * turn} />
              <circle cx={-34} cy={-376} r={9 * turn} fill="#fff4f0" />
              <circle cx={34} cy={-376} r={9 * turn} fill="#fff4f0" />
            </>
          )}
        </g>
      </Svg>
      {hit > 0 && <div style={{ position: "absolute", inset: 0, background: C.red, opacity: hit * 0.4, mixBlendMode: "screen" }} />}
    </div>
  );
};

/* line 17 → 19: the breakers. Block by block. To starve it. */
export const SceneShutdown: React.FC<P> = ({ t }) => {
  const off = ramp(t, L("17") + 0.9, L("18"));
  const dead = t >= L("18") - 0.05;
  if (t < L("17") + 1.4 || dead) {
    // the map going dark, and then nothing but an emergency light
    const em = dead ? 0.5 + 0.5 * Math.sin((t - L("18")) * 5) : 0;
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {!dead && <GridMap t={t} spread={1} off={off} />}
        {dead && (
          <>
            <div style={{ position: "absolute", inset: 0, background: "#000" }} />
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 540px 380px, rgba(229,36,59,${0.35 * em}), transparent 55%)` }} />
          </>
        )}
      </div>
    );
  }
  // a row of breaker handles dropping one after another
  return (
    <div style={{ position: "absolute", inset: 0, background: "#07080c", overflow: "hidden" }}>
      <Svg>
        <rect x={60} y={500} width={960} height={900} rx={20} fill="#1a1d25" />
        {Array.from({ length: 8 }).map((_, i) => {
          const down = ramp(t, L("17") + 1.4, L("18") - 0.1) * 8 > i;
          const x = 120 + (i % 4) * 225, y = 600 + Math.floor(i / 4) * 420;
          return (
            <g key={i}>
              <rect x={x} y={y} width={160} height={340} rx={12} fill="#0d0f14" />
              <rect x={x + 50} y={down ? y + 190 : y + 30} width={60} height={120} rx={10} fill={down ? "#3a3d46" : "#c9ccd1"} />
              <circle cx={x + 80} cy={y + 310} r={12} fill={down ? "#2a0a0e" : "#4fd17a"} />
              <text x={x + 80} y={y - 14} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={24} fill={C.sub} letterSpacing={2}>
                {["N1", "N2", "N3", "W1", "W2", "LOOP", "S1", "S2"][i]}
              </text>
            </g>
          );
        })}
      </Svg>
    </div>
  );
};

/* line 19 → 22: writing the list by the emergency light; the last name, circled */
export const SceneWriting: React.FC<P> = ({ t }) => {
  const write = ramp(t, L("19") + 0.3, LE("20"));
  const circle = ease(ramp(t, L("21") + 1.6, LE("21") + 0.1));
  const em = 0.75 + 0.25 * Math.sin(t * 5);
  const focus = ease(ramp(t, L("21"), L("21") + 1.2));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#060407", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(0, ${lerp(0, -330, focus)}px) scale(${lerp(1, 1.35, focus)})`, transformOrigin: "540px 1150px" }}>
        <List write={write} strike={0} circle={circle} />
      </div>
      <div style={{ position: "absolute", inset: 0, background: `rgba(229,36,59,${0.16 * em})`, mixBlendMode: "multiply" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 540px 300px, rgba(229,36,59,${0.12 * em}), transparent 60%)` }} />
    </div>
  );
};

/* line 22 → 25: him, backlit; then the tunnel grate at his feet */
export const SceneGeorge: React.FC<P> = ({ t }) => {
  const speak = t < LE("24") + 0.2;
  const red = speak ? 0.16 + 0.08 * Math.sin(t * 6) : 0;
  if (t >= L("23") - 0.15 && t < L("24") - 0.15) {
    // the grate, candlelight leaking up from the tunnel
    const fl = 1 + 0.1 * Math.sin(t * 13) + 0.05 * Math.sin(t * 29);
    return (
      <div style={{ position: "absolute", inset: 0, background: "#050608", overflow: "hidden" }}>
        <Svg style={{ transform: `scale(${lerp(1, 1.12, ramp(t, L("23"), L("24")))})`, transformOrigin: "540px 1000px" }}>
          <ellipse cx={540} cy={1000} rx={420} ry={210} fill={C.warm} opacity={0.12 * fl} />
          <ellipse cx={540} cy={1000} rx={300} ry={140} fill="#1b1610" />
          <ellipse cx={540} cy={1000} rx={300} ry={140} fill={C.warm} opacity={0.18 * fl} />
          {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={270 + i * 64} y={870} width={20} height={260} fill="#14151a" />)}
          <ellipse cx={540} cy={1000} rx={310} ry={150} fill="none" stroke="#2a2c33" strokeWidth={24} />
          {/* his boots at the edge */}
          <rect x={300} y={1260} width={150} height={70} rx={20} fill="#0a0b10" />
          <rect x={620} y={1260} width={150} height={70} rx={20} fill="#0a0b10" />
        </Svg>
        <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 300px rgba(229,36,59,${red})` }} />
      </div>
    );
  }
  const close = t < L("24") ? 1.9 : 2.3;
  const push = lerp(1, 1.12, easeIO(ramp(t, t < L("24") ? L("22") : L("24"), t < L("24") ? L("23") : L("25"))));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "540px 700px" }}>
        <Street t={t} man={1} glare={1} rim={0.9} manScale={close} />
      </div>
      <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 300px rgba(229,36,59,${red})` }} />
    </div>
  );
};

/* line 25 → 28: the notebook. A new line, writing itself. */
export const SceneNote: React.FC<P> = ({ t }) => {
  const open = ease(ramp(t, L("25") + 0.4, L("25") + 1.0));
  const w1 = ramp(t, L("26") + 0.8, LE("26"));
  const w2 = ramp(t, L("27"), L("27") + 1.0);
  const w3 = ramp(t, L("27") + 1.0, LE("27"));
  const push = lerp(1.05, 1.3, easeIO(ramp(t, L("26"), L("28"))));
  const hl = 1 + 0.05 * Math.sin(t * 9);
  const line = (s: string, k: number, top: number, color = "#1f2230") => (
    <div style={{ position: "absolute", left: 150, top, fontFamily: F.pencil, fontSize: 96, color, whiteSpace: "nowrap", clipPath: `inset(0 ${100 - k * 100}% 0 0)` }}>{s}</div>
  );
  return (
    <div style={{ position: "absolute", inset: 0, background: "#07080c", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 540px 200px, rgba(255,241,196,${0.18 * hl}), transparent 60%)` }} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push}) rotate(-2deg)`, transformOrigin: "540px 1000px" }}>
        <div style={{ position: "absolute", left: 80, top: 420, width: 920, height: 1100, ...PAPER, boxShadow: "0 40px 120px rgba(0,0,0,.9)" }}>
          {/* old pages' writing, faint */}
          <div style={{ position: "absolute", left: 150, top: 40, fontFamily: F.pencil, fontSize: 70, color: "#1f2230", opacity: 0.35, lineHeight: "121px" }}>
            Day 6. no food left.
            <br />
            5 PM engines. white trucks
          </div>
          {line("Don't trust him.", w2, 520)}
          {line("Look at his eyes.", w3, 640)}
          {/* pencil tip, moving along the newest stroke */}
          {w1 > 0 && w3 < 1 && (
            <div style={{ position: "absolute", left: 150 + (w3 > 0 ? w3 * 620 : w2 * 560), top: w3 > 0 ? 640 : 520, width: 14, height: 260, background: "#c49a3a", transform: "rotate(28deg)", transformOrigin: "0 0", opacity: 0.9 }} />
          )}
        </div>
        {/* page turning over */}
        {open < 1 && <div style={{ position: "absolute", left: 80, top: 420, width: 920, height: 1100, ...PAPER, transformOrigin: "0 50%", transform: `perspective(1800px) rotateY(${-open * 170}deg)`, filter: "brightness(.8)" }} />}
      </div>
    </div>
  );
};

/* line 28 → silence: I looked up. His eyes, lit from the inside. */
export const SceneEyes: React.FC<P> = ({ t }) => {
  const up = easeIO(ramp(t, L("28") - 0.2, LE("28") + 0.4));
  const eyes = ease(ramp(t, L("29") + 0.9, L("29") + 1.5));
  const veins = ramp(t, L("29") + 1.3, LE("29") + 0.2);
  const push = lerp(1, 1.9, easeIO(ramp(t, L("29"), T.silenceStart)));
  const hit = t > LE("29") - 0.15 ? Math.exp(-(t - LE("29") + 0.15) * 3) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${lerp(-700, 0, up) + lerp(0, 260, easeIO(ramp(t, L("29"), T.silenceStart)))}px) scale(${push})`, transformOrigin: "540px 640px" }}>
        <Street t={t} man={1} glare={1 - eyes * 0.5} rim={0.9} manScale={2.3} eyes={eyes} veins={veins} />
      </div>
      {/* the notebook dropping out of frame below */}
      {up < 1 && <div style={{ position: "absolute", left: 80, top: lerp(420, 2200, up), width: 920, height: 1100, ...PAPER }} />}
      {hit > 0 && <div style={{ position: "absolute", inset: 0, background: C.red, opacity: hit * 0.45, mixBlendMode: "screen" }} />}
    </div>
  );
};

/* End card: Part 7, and a question for the comments */
export const EndCard6: React.FC<P> = ({ t }) => {
  const s = T.endCardStart;
  const k = ease(ramp(t, s, s + 0.6));
  const k2 = ease(ramp(t, s + 0.5, s + 1.1));
  const k3 = ease(ramp(t, s + 1.0, s + 1.6));
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 38%, #1A1F33 0%, ${C.bg} 62%)` }}>
      <div style={{ position: "absolute", top: 520, width: W, textAlign: "center", fontFamily: F.body, fontWeight: 800, fontSize: 40, letterSpacing: 8, color: C.sub, opacity: k }}>
        BLACKOUT · PART 7
      </div>
      <div style={{ position: "absolute", top: 610, width: W, textAlign: "center", fontFamily: F.display, fontSize: 150, lineHeight: 1.02, letterSpacing: 4, color: C.ink, opacity: k, transform: `translateY(${lerp(30, 0, k)}px)` }}>
        WHO&apos;S
        <br />
        <span style={{ color: C.red }}>LYING?</span>
      </div>
      <div style={{ position: "absolute", top: 1000, width: W, display: "flex", justifyContent: "center", opacity: k2 }}>
        <div style={{ padding: "14px 34px", borderRadius: 14, background: C.red, fontFamily: F.body, fontWeight: 800, fontSize: 44, letterSpacing: 4, color: "#fff" }}>FOLLOW FOR PART 7</div>
      </div>
      <div style={{ position: "absolute", top: 1110, width: W, textAlign: "center", fontFamily: F.body, fontWeight: 700, fontSize: 36, letterSpacing: 6, color: C.sub, opacity: k3 }}>
        COMMENT: HIM OR HER?
      </div>
    </div>
  );
};
