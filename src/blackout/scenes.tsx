import React from "react";
import { random } from "remotion";
import { C, F, L, LE, T, clamp, ease, easeIO, lerp, ramp } from "./theme";

type P = { t: number };
const W = 1080;
const H = 1920;

const Svg: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, ...style }}>
    {children}
  </svg>
);

/* ---------- Door (front view) ---------- */
export const Door: React.FC<{
  t: number;
  label: string;
  lightUnder?: number; // 0..1 warm light under the door
  feet?: boolean; // shadows of someone standing outside
  day?: number; // 0 night .. 1 cold morning
  xMark?: number; // 0..1 red X drawn
  ajar?: number; // 0..1 opening gap
}> = ({ t, label, lightUnder = 0, feet = false, day = 0, xMark = 0, ajar = 0 }) => {
  const x = 300, y = 360, w = 480, h = 960;
  const wall = day ? "#20263a" : C.navy2;
  const doorFill = day ? "#2c3550" : "#1a1f33";
  const len = Math.hypot(w - 120, h - 200);
  return (
    <Svg>
      <rect width={W} height={H} fill={wall} />
      {/* floor */}
      <rect y={y + h} width={W} height={H - y - h} fill={day ? "#151a29" : "#07080d"} />
      {/* frame */}
      <rect x={x - 34} y={y - 34} width={w + 68} height={h + 34} fill={day ? "#3a4566" : C.steel} />
      <rect x={x} y={y} width={w} height={h} fill={doorFill} />
      {/* ajar gap */}
      {ajar > 0 && <rect x={x + w - 90 * ajar} y={y} width={90 * ajar} height={h} fill="#020203" />}
      {/* panels */}
      <g fill="none" stroke={day ? "#3d4870" : "#262c45"} strokeWidth={10}>
        <rect x={x + 60} y={y + 70} width={w - 120 - 90 * ajar} height={360} />
        <rect x={x + 60} y={y + 500} width={w - 120 - 90 * ajar} height={380} />
      </g>
      {/* knob */}
      <circle cx={x + w - 70 - 90 * ajar} cy={y + 470} r={20} fill={day ? "#8890a8" : "#565d78"} />
      {/* number plate */}
      <rect x={x + w / 2 - 70} y={y + 140} width={140} height={84} rx={8} fill={day ? "#c8ccd8" : "#3a4058"} />
      <text x={x + w / 2} y={y + 205} textAnchor="middle" fontFamily={F.display} fontSize={64} fill={day ? C.bg : "#9aa0b8"}>
        {label}
      </text>
      {/* light under door */}
      {lightUnder > 0 && (
        <>
          <rect x={x} y={y + h - 8} width={w} height={8} fill={C.warm} opacity={lightUnder} />
          <ellipse cx={x + w / 2} cy={y + h + 10} rx={w * 0.7} ry={40} fill={C.warm} opacity={lightUnder * 0.18} />
          {feet && (
            <>
              <rect x={x + 150} y={y + h - 8} width={70} height={8} fill="#000" />
              <rect x={x + 270} y={y + h - 8} width={70} height={8} fill="#000" />
            </>
          )}
        </>
      )}
      {/* red X */}
      {xMark > 0 && (
        <g stroke={C.red} strokeWidth={34} strokeLinecap="round" fill="none" opacity={0.92}>
          <path d={`M ${x + 60} ${y + 100} L ${x + w - 60} ${y + h - 100}`} strokeDasharray={len} strokeDashoffset={len * (1 - clamp(xMark * 2))} />
          <path d={`M ${x + w - 60} ${y + 100} L ${x + 60} ${y + h - 100}`} strokeDasharray={len} strokeDashoffset={len * (1 - clamp(xMark * 2 - 1))} />
        </g>
      )}
    </Svg>
  );
};

/* Scene 1: someone is at the door (0 → line 08) */
export const SceneDoor: React.FC<P> = ({ t }) => {
  // knock hits at 0.15 / 0.8 / 1.45 s
  const hit = [0.15, 0.8, 1.45].reduce((m, k) => Math.max(m, t >= k ? Math.exp(-(t - k) * 14) : 0), 0);
  const shakeX = Math.sin(t * 90) * 10 * hit;
  const push = lerp(1, 1.2, easeIO(ramp(t, 2, L("08"))));
  // heartbeat on "Neither of us breathed"
  const hb = [0, 0.28, 1.0, 1.28].reduce((m, k) => {
    const s = L("07") + k;
    return Math.max(m, t >= s ? Math.exp(-(t - s) * 9) : 0);
  }, 0);
  const radio = ramp(t, L("04"), L("04") + 0.4) * (1 - ramp(t, LE("04"), LE("04") + 0.4));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${shakeX}px) scale(${push * (1 + hb * 0.02)})`, transformOrigin: "540px 1100px" }}>
        <Door t={t} label="6B" lightUnder={0.7 + 0.3 * Math.sin(t * 3)} feet />
      </div>
      {/* the radio reading the address */}
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity: radio }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(5,6,11,0.82)" }} />
        <Radio t={t} on={1} scale={0.8} y={-60} />
      </div>
      <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 ${200 + hb * 200}px rgba(229,36,59,${0.12 + hb * 0.35})` }} />
    </div>
  );
};

/* Scene 2: the note slides under the door, then close-up (line 08 → line 11) */
export const SceneNote: React.FC<P> = ({ t }) => {
  const slide = ease(ramp(t, LE("08") - 0.9, LE("08") + 0.2));
  const close = ramp(t, L("09"), L("09") + 0.35);
  const s10 = L("10"), e10 = LE("10");
  const write1 = ramp(t, s10 - 0.1, s10 + (e10 - s10) * 0.48);
  const write2 = ramp(t, s10 + (e10 - s10) * 0.52, e10);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - close, transform: "scale(1.35)", transformOrigin: "540px 1250px" }}>
        <Door t={t} label="6B" lightUnder={0.8} />
        <Svg>
          <g transform={`translate(540 ${lerp(1316, 1460, slide)}) rotate(${lerp(0, -6, slide)})`}>
            <rect x={-130} y={-6} width={260} height={lerp(10, 170, slide)} fill="#d9d4c7" />
          </g>
        </Svg>
      </div>
      {close > 0 && (
        <div style={{ position: "absolute", inset: 0, opacity: close, background: "#06070b" }}>
          <div
            style={{
              position: "absolute", left: 90, top: 380, width: 900, height: 560, background: "#d6d0c2",
              transform: `rotate(-3deg) scale(${lerp(1.04, 1, ease(close))})`,
              boxShadow: "0 30px 80px rgba(0,0,0,.7)",
              backgroundImage: "repeating-linear-gradient(transparent 0 78px, rgba(60,80,140,.25) 78px 80px)",
            }}
          >
            <div style={{ position: "absolute", left: 60, top: 140, fontFamily: F.pencil, fontSize: 112, color: "#3a3a3e", lineHeight: "160px" }}>
              <div style={{ clipPath: `inset(0 ${100 - write1 * 100}% 0 0)`, whiteSpace: "nowrap" }}>Leave before sunrise.</div>
              <div style={{ clipPath: `inset(0 ${100 - write2 * 100}% 0 0)`, whiteSpace: "nowrap" }}>Don't stay on the list.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Day title card with the brand's flatline */
export const DayCard: React.FC<P & { day: string; start: number }> = ({ t, day, start }) => {
  const k = ramp(t, start, start + 0.5);
  const flick = random(`d${Math.floor(t * 30)}`) > 0.85 ? 0.6 : 1;
  const path = "M 140 1060 L 420 1060 L 460 980 L 510 1150 L 560 900 L 615 1120 L 660 1020 L 700 1060 L 940 1060";
  return (
    <div style={{ position: "absolute", inset: 0, background: C.bg }}>
      <div style={{ position: "absolute", top: 640, width: W, textAlign: "center", fontFamily: F.display, fontSize: 250, letterSpacing: 12, color: C.ink, opacity: k * flick }}>
        {day}
      </div>
      <Svg>
        <path d={path} fill="none" stroke={C.red} strokeWidth={14} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={1400} strokeDashoffset={1400 * (1 - ease(k))} />
        <circle cx={940} cy={1060} r={16} fill={C.red} opacity={k} />
      </Svg>
    </div>
  );
};

/* Scene: the hallway, red X on every door (line 12 → line 16) */
export const SceneHallway: React.FC<P> = ({ t }) => {
  const open = ease(ramp(t, L("12"), L("12") + 1.2));
  const ours = t >= L("15");
  if (ours) {
    const k = ramp(t, L("15"), L("15") + 0.3);
    return (
      <div style={{ position: "absolute", inset: 0, opacity: k }}>
        <Door t={t} label="6B" day={1} />
        <Svg>
          <rect x={300} y={360} width={480} height={960} fill="none" stroke={C.ink} strokeWidth={4} strokeDasharray="20 18" opacity={0.25 + 0.2 * Math.sin(t * 4)} />
        </Svg>
      </div>
    );
  }
  // one-point perspective corridor
  const near = { l: -40, r: W + 40, t: 180, b: 1560 };
  const far = { l: 430, r: 650, t: 700, b: 1010 };
  const at = (d: number) => ({ l: lerp(near.l, far.l, d), r: lerp(near.r, far.r, d), t: lerp(near.t, far.t, d), b: lerp(near.b, far.b, d) });
  const doors = [0.08, 0.38, 0.62, 0.8];
  const xStart = L("14") + 0.6;
  const cam = lerp(1.0, 1.12, ramp(t, L("12"), L("15")));
  const poly = (pts: number[][]) => pts.map((p) => p.join(",")).join(" ");
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: open }}>
      <Svg style={{ transform: `scale(${cam})`, transformOrigin: "540px 860px" }}>
        <defs>
          <linearGradient id="end" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8fa0c8" />
            <stop offset="1" stopColor="#4a5880" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="#1a2032" />
        {/* ceiling, floor, walls */}
        <polygon points={poly([[near.l, near.t], [near.r, near.t], [far.r, far.t], [far.l, far.t]])} fill="#232a40" />
        <polygon points={poly([[near.l, near.b], [near.r, near.b], [far.r, far.b], [far.l, far.b]])} fill="#121624" />
        <polygon points={poly([[near.l, near.t], [far.l, far.t], [far.l, far.b], [near.l, near.b]])} fill="#2a3249" />
        <polygon points={poly([[near.r, near.t], [far.r, far.t], [far.r, far.b], [near.r, near.b]])} fill="#262d43" />
        {/* window at the end: cold sunrise */}
        <rect x={far.l} y={far.t} width={far.r - far.l} height={far.b - far.t} fill="url(#end)" />
        {doors.map((d, i) => {
          const a = at(d), b = at(d + 0.12);
          const hA = (a.b - a.t) * 0.78, hB = (b.b - b.t) * 0.78;
          return [0, 1].map((side) => {
            const xa = side ? a.r : a.l, xb = side ? b.r : b.l;
            const pts = [[xa, a.b], [xa, a.b - hA], [xb, b.b - hB], [xb, b.b]];
            const idx = i * 2 + side;
            const k = clamp((t - xStart - idx * 0.22) / 0.5);
            const inset = (p: number[], q: number[], f: number) => [lerp(p[0], q[0], f), lerp(p[1], q[1], f)];
            const p1 = inset(pts[1], pts[3], 0.12), p2 = inset(pts[3], pts[1], 0.12);
            const p3 = inset(pts[2], pts[0], 0.12), p4 = inset(pts[0], pts[2], 0.12);
            return (
              <g key={`${i}-${side}`}>
                <polygon points={poly(pts)} fill="#323b58" stroke="#1a2032" strokeWidth={6} />
                {k > 0 && (
                  <g stroke={C.red} strokeWidth={lerp(26, 8, d)} strokeLinecap="round" opacity={0.92}>
                    <line x1={p1[0]} y1={p1[1]} x2={lerp(p1[0], p2[0], clamp(k * 2))} y2={lerp(p1[1], p2[1], clamp(k * 2))} />
                    {k > 0.5 && <line x1={p3[0]} y1={p3[1]} x2={lerp(p3[0], p4[0], clamp(k * 2 - 1))} y2={lerp(p3[1], p4[1], clamp(k * 2 - 1))} />}
                  </g>
                )}
              </g>
            );
          });
        })}
      </Svg>
    </div>
  );
};

/* Scene: inside 6A (line 16 → line 20) */
export const Scene6A: React.FC<P> = ({ t }) => {
  if (t < L("17")) {
    const k = ease(ramp(t, L("16"), L("16") + 1.2));
    return <Door t={t} label="6A" day={1} xMark={1} ajar={k} />;
  }
  const pan = easeIO(ramp(t, L("17"), LE("19")));
  const ty = lerp(260, -330, pan);
  const dust = Array.from({ length: 40 }, (_, i) => {
    const x = random(`dx${i}`) * W, y0 = random(`dy${i}`) * H;
    return { x: x + Math.sin(t * 0.6 + i) * 20, y: (y0 - t * 18) % H, r: 1.5 + random(`dr${i}`) * 2.5 };
  });
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Svg style={{ transform: `translateY(${ty}px) scale(1.15)`, transformOrigin: "540px 960px" }}>
        <rect y={-600} width={W} height={H + 1200} fill="#1d2335" />
        {/* hook rail and coats */}
        <rect x={140} y={300} width={800} height={22} fill="#3a4260" />
        {[240, 440, 640, 840].map((x, i) => (
          <g key={x}>
            <circle cx={x} cy={330} r={10} fill="#5a6280" />
            {i !== 2 && (
              <path
                d={`M ${x} 336 L ${x - 70} 420 L ${x - 95} 760 L ${x + 95} 760 L ${x + 70} 420 Z`}
                fill={["#2b2a33", "#3a2e2a", "", "#262c3c"][i]}
              />
            )}
            {i === 2 && <path d={`M ${x} 336 L ${x - 40} 380 L ${x - 50} 560 L ${x + 50} 560 L ${x + 40} 380 Z`} fill="#4a3030" />}
          </g>
        ))}
        {/* table with plates, chairs pushed back */}
        <rect x={120} y={1180} width={840} height={30} fill="#3b3229" />
        <rect x={160} y={1210} width={24} height={300} fill="#2e2620" />
        <rect x={896} y={1210} width={24} height={300} fill="#2e2620" />
        {[260, 540, 820].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={1172} rx={110} ry={22} fill="#c8ccd8" />
            <ellipse cx={x} cy={1168} rx={70} ry={12} fill="#9aa0b0" />
          </g>
        ))}
        <rect x={500} y={1050} width={36} height={118} rx={6} fill="#7d8aa8" opacity={0.7} />
        <g fill="#191d2c">
          <rect x={30} y={1080} width={26} height={420} transform="rotate(-8 43 1290)" />
          <rect x={30} y={1250} width={140} height={22} transform="rotate(-8 43 1290)" />
          <rect x={1000} y={1100} width={26} height={400} />
          <rect x={900} y={1260} width={126} height={22} />
        </g>
      </Svg>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {dust.map((d, i) => <circle key={i} cx={d.x} cy={(d.y + H) % H} r={d.r} fill="#e8e2d0" opacity={0.25} />)}
      </svg>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(110deg, rgba(160,180,220,.16), transparent 55%)" }} />
    </div>
  );
};

/* Radio (used for the address and the broadcast) */
export const Radio: React.FC<{ t: number; on: number; scale?: number; y?: number; levels?: number[] }> = ({ t, on, scale = 1, y = 0, levels }) => {
  const bars = levels ?? Array.from({ length: 24 }, (_, i) => 0.3 + 0.7 * Math.abs(Math.sin(t * 9 + i * 1.7) * Math.sin(t * 4.3 + i)));
  return (
    <Svg style={{ transform: `translateY(${y}px) scale(${scale})`, transformOrigin: "540px 860px" }}>
      <rect x={160} y={560} width={760} height={560} rx={48} fill="#262330" stroke="#3a3446" strokeWidth={8} />
      <rect x={210} y={610} width={300} height={460} rx={20} fill="#1a1822" />
      {Array.from({ length: 9 }).map((_, r) =>
        Array.from({ length: 6 }).map((__, c) => <circle key={`${r}${c}`} cx={250 + c * 44} cy={650 + r * 48} r={11} fill="#0c0b10" />),
      )}
      <rect x={560} y={630} width={320} height={130} rx={12} fill={on ? "#3a1a1e" : "#15141b"} />
      {on > 0 && <rect x={560} y={630} width={320} height={130} rx={12} fill={C.red} opacity={0.18 * on} />}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line key={i} x1={590 + i * 44} y1={650} x2={590 + i * 44} y2={i % 2 ? 668 : 680} stroke={on ? "#f2b7bd" : "#4a4656"} strokeWidth={3} />
      ))}
      <line x1={700 + Math.sin(t * 0.7) * 6} y1={640} x2={700 + Math.sin(t * 0.7) * 6} y2={750} stroke={C.red} strokeWidth={5} opacity={0.4 + 0.6 * on} />
      <circle cx={630} cy={900} r={58} fill="#3a3446" />
      <circle cx={810} cy={900} r={58} fill="#3a3446" />
      <circle cx={630} cy={900} r={12} fill="#1a1822" />
      <circle cx={810} cy={900} r={12} fill="#1a1822" />
      <circle cx={880} cy={1060} r={10} fill={on ? C.red : "#3a3446"} />
      {on > 0 &&
        bars.map((v, i) => (
          <rect key={i} x={250 + i * 24} y={520 - v * 110 * on} width={14} height={v * 110 * on} rx={4} fill={C.red} opacity={0.85} />
        ))}
    </Svg>
  );
};

export const SceneRadio: React.FC<P & { levels: number[] }> = ({ t, levels }) => {
  const on = t >= L("20") + 2.2 ? 1 : 0;
  const zoom = lerp(1, 1.12, easeIO(ramp(t, L("20"), LE("22"))));
  const glow = on * (0.6 + 0.4 * levels.reduce((a, b) => a + b, 0) / Math.max(1, levels.length));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#07080d" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 46%, rgba(229,36,59,${0.22 * glow}), transparent 60%)` }} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "540px 860px" }}>
        <Radio t={t} on={on} levels={on ? levels : undefined} />
      </div>
    </div>
  );
};

/* Scene: candle, Mrs. Alvarez whispers; it goes out on "He never did." */
export const SceneCandle: React.FC<P> = ({ t }) => {
  const out = t >= L("25") + 0.6;
  const fl = 1 + 0.08 * Math.sin(t * 13) + 0.05 * Math.sin(t * 29 + 1);
  const sway = Math.sin(t * 2.3) * 6;
  const smoke = ramp(t, L("25") + 0.6, L("25") + 2.2);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#050608", overflow: "hidden" }}>
      {!out && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 540px 780px, rgba(255,200,112,${0.32 * fl}), rgba(255,200,112,0.05) 35%, transparent 60%)` }} />}
      <Svg>
        {/* window behind, faint */}
        <rect x={640} y={380} width={300} height={420} fill="#0d1220" stroke="#1b2133" strokeWidth={14} />
        <line x1={790} y1={380} x2={790} y2={800} stroke="#1b2133" strokeWidth={10} />
        <rect x={500} y={880} width={80} height={300} rx={6} fill={out ? "#2a2a2e" : "#d9cdb0"} />
        <rect x={420} y={1180} width={240} height={26} rx={8} fill={out ? "#1a1a1e" : "#6b5a3a"} />
        <line x1={540} y1={880} x2={540} y2={860} stroke="#222" strokeWidth={5} />
        {!out && (
          <g transform={`translate(${540 + sway * 0.3} 860) scale(1 ${fl})`}>
            <path d={`M 0 0 C -28 -30 -18 -80 ${sway} -120 C 18 -80 28 -30 0 0 Z`} fill={C.warm} />
            <path d={`M 0 -4 C -12 -20 -8 -50 ${sway * 0.5} -70 C 8 -50 12 -20 0 -4 Z`} fill="#fff4dc" />
          </g>
        )}
        {out && smoke < 1 && (
          <path
            d={`M 540 860 C ${520 + Math.sin(t * 3) * 20} 780, ${570 + Math.sin(t * 2) * 30} 700, ${540 + Math.sin(t) * 40} ${640 - smoke * 120}`}
            fill="none" stroke="#8a8a90" strokeWidth={6} opacity={0.5 * (1 - smoke)}
          />
        )}
      </Svg>
    </div>
  );
};

/* Scene: the notebook (line 27 → line 31) */
export const SceneNotebook: React.FC<P> = ({ t }) => {
  const lines: [string, string][] = [
    ["Day 6.", "27"],
    ["No food left.", "27"],
    ["Stay and freeze,", "28"],
    ["or go and find out.", "28"],
    ["Writing it all down", "29"],
    ["in case someone finds this.", "30"],
  ];
  const tilt = lerp(-4, -2, ramp(t, L("27"), LE("30")));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0a0b10", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute", left: 70, top: 390, width: 940, height: 860, background: "#cfc8b8",
          transform: `rotate(${tilt}deg)`, boxShadow: "0 40px 100px rgba(0,0,0,.8)",
          backgroundImage: "linear-gradient(90deg, transparent 110px, rgba(229,36,59,.55) 110px 114px, transparent 114px), repeating-linear-gradient(transparent 0 118px, rgba(60,80,140,.28) 118px 121px)",
        }}
      >
        <div style={{ position: "absolute", left: 140, top: 40, fontFamily: F.pencil, fontSize: 92, color: "#34343a", lineHeight: "121px" }}>
          {lines.map(([text, id], i) => {
            const sameLine = lines.filter((l) => l[1] === id);
            const k = sameLine.indexOf(lines[i]);
            const s = L(id), e = LE(id);
            const span = (e - s) / sameLine.length;
            const w = ramp(t, s + k * span, s + (k + 1) * span);
            return (
              <div key={i} style={{ whiteSpace: "nowrap", clipPath: `inset(0 ${100 - w * 100}% 0 0)` }}>
                {text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* Scene: the street at 5 PM, white trucks, the man who waves (line 31 → silence) */
export const SceneStreet: React.FC<P> = ({ t }) => {
  const shake = t > L("31") + 0.9 ? Math.sin(t * 47) * 2.2 * ramp(t, L("31") + 0.9, L("31") + 4) : 0;
  const arrive = ease(ramp(t, L("33") - 0.4, LE("35")));
  const step = ease(ramp(t, L("36"), L("36") + 1.0));
  const zoom = easeIO(ramp(t, L("36") + 0.6, L("37") + 1.2));
  const look = ease(ramp(t, L("37"), L("37") + 0.8));
  const wave = t > L("38") ? Math.sin((t - L("38")) * 9) * 28 : 0;
  const waveUp = ease(ramp(t, L("38") - 0.1, L("38") + 0.25));
  const manX = 600, manY = 1210, UP = -300;
  const truckXs = [0, 1, 2, 3].map((i) => lerp(1300 + i * 330, 120 + i * 330, arrive));
  const scale = lerp(1, 2.2, zoom);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: C.bg }}>
      <Svg style={{ transform: `translate(${shake}px, 0) scale(${scale})`, transformOrigin: `${manX}px ${manY - 60 + UP}px` }}>
        <g transform={`translate(0 ${UP})`}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#05060B" />
            <stop offset="0.6" stopColor="#0D1020" />
            <stop offset="1" stopColor={C.dusk} />
          </linearGradient>
        </defs>
        <rect y={-UP} width={W} height={H} fill="url(#sky)" transform={`translate(0 ${UP * 2})`} />
        <rect y={-UP} width={W} height={H + 400} fill="url(#sky)" />
        {/* building across the street, all dark */}
        <rect x={0} y={420} width={W} height={720} fill="#141828" />
        {Array.from({ length: 5 }).map((_, r) =>
          Array.from({ length: 6 }).map((__, c) => <rect key={`${r}${c}`} x={70 + c * 165} y={480 + r * 125} width={70} height={80} fill="#0E111C" />),
        )}
        {/* street */}
        <rect x={0} y={1140} width={W} height={900} fill="#0a0c14" />
        <rect x={0} y={1140} width={W} height={10} fill="#1e2335" />
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={i * 200 + 30} y={1262} width={110} height={8} fill="#1e2335" />)}
        {/* trucks: white, no lights, no markings */}
        {truckXs.map((x, i) => (
          <g key={i} transform={`translate(${x} 1150)`}>
            <rect x={0} y={0} width={210} height={110} fill="#d8dbe2" />
            <rect x={210} y={36} width={70} height={74} fill="#c5c9d2" />
            <rect x={232} y={46} width={38} height={28} fill="#1a1f2e" />
            <circle cx={50} cy={116} r={18} fill="#05060b" />
            <circle cx={240} cy={116} r={18} fill="#05060b" />
          </g>
        ))}
        {/* the man */}
        {step > 0 && (
          <g transform={`translate(${manX} ${lerp(manY - 20, manY, step)})`} opacity={step}>
            <rect x={-16} y={-120} width={32} height={78} rx={8} fill="#020306" />
            <rect x={-14} y={-44} width={11} height={52} fill="#020306" />
            <rect x={3} y={-44} width={11} height={52} fill="#020306" />
            <g transform={`translate(0 ${-148 - look * 3}) rotate(${-look * 8})`}>
              <circle r={22} fill="#020306" />
              {look > 0.6 && (
                <>
                  <circle cx={-7} cy={-4} r={2.2} fill={C.ink} opacity={look} />
                  <circle cx={7} cy={-4} r={2.2} fill={C.ink} opacity={look} />
                </>
              )}
            </g>
            {/* left arm down, right arm waves */}
            <rect x={-26} y={-114} width={10} height={64} rx={5} fill="#020306" />
            <g transform={`translate(18 -110) rotate(${lerp(-10, -160, waveUp) + wave * waveUp})`}>
              <rect x={-5} y={0} width={10} height={64} rx={5} fill="#020306" />
            </g>
          </g>
        )}
        </g>
      </Svg>
      {/* our window frame in the foreground */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <rect x={0} y={0} width={W} height={H} fill="none" stroke="#06070b" strokeWidth={140} />
        <line x1={540} y1={0} x2={540} y2={H} stroke="#06070b" strokeWidth={26} opacity={1 - zoom} />
        <line x1={0} y1={640} x2={W} y2={640} stroke="#06070b" strokeWidth={26} opacity={1 - zoom} />
      </svg>
    </div>
  );
};

/* End card: Last Signal logo + follow */
export const EndCard: React.FC<P> = ({ t }) => {
  const s = T.endCardStart;
  const k = ease(ramp(t, s, s + 0.6));
  const k2 = ease(ramp(t, s + 0.5, s + 1.1));
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 38%, #1A1F33 0%, ${C.bg} 62%)` }}>
      <Svg style={{ opacity: k, transform: `translateY(${lerp(30, 0, k)}px)` }}>
        <g transform="translate(0 120) scale(1)">
          <g fill="none" stroke={C.red} strokeLinecap="round">
            <path d="M 430 250 A 150 150 0 0 0 430 470" strokeWidth={16} />
            <path d="M 650 250 A 150 150 0 0 1 650 470" strokeWidth={16} />
            <path d="M 375 200 A 220 220 0 0 0 375 520" strokeWidth={14} opacity={0.6} />
            <path d="M 705 200 A 220 220 0 0 1 705 520" strokeWidth={14} opacity={0.6} />
          </g>
          <g fill="none" stroke={C.ink} strokeWidth={14} strokeLinejoin="round" strokeLinecap="round">
            <path d="M 540 360 L 450 700 M 540 360 L 630 700" />
            <path d="M 517 447 L 563 447 M 495 530 L 585 530 M 473 615 L 607 615" />
            <path d="M 517 447 L 585 530 M 563 447 L 495 530 M 495 530 L 607 615 M 585 530 L 473 615" />
            <path d="M 420 700 L 660 700" />
          </g>
          <circle cx={540} cy={350} r={30} fill={C.red} />
          <circle cx={540} cy={350} r={60 + Math.sin(t * 4) * 6} fill={C.red} opacity={0.25} />
        </g>
      </Svg>
      <div style={{ position: "absolute", top: 870, width: W, textAlign: "center", fontFamily: F.display, fontSize: 130, letterSpacing: 8, color: C.ink, opacity: k }}>
        LAST SIGNAL
      </div>
      <div style={{ position: "absolute", top: 1040, width: W, display: "flex", justifyContent: "center", opacity: k2 }}>
        <div style={{ padding: "14px 34px", borderRadius: 14, background: C.red, fontFamily: F.body, fontWeight: 800, fontSize: 44, letterSpacing: 4, color: "#fff" }}>
          PART 3 TOMORROW
        </div>
      </div>
      <div style={{ position: "absolute", top: 1150, width: W, textAlign: "center", fontFamily: F.body, fontWeight: 700, fontSize: 36, letterSpacing: 6, color: C.sub, opacity: k2 }}>
        FOLLOW SO YOU DON'T MISS IT
      </div>
    </div>
  );
};
