import React from "react";
import { random } from "remotion";
import { C, Chip, Figure, FONT, L, LE, Label, Spotlight, T, back, clamp, draw, ease, easeIO, flickerOff, flickerOn, lerp, neon, ramp } from "./kit";

const FLOOR = 1180;
const AX = 300, BX = 720;
const E = T.events;

const Floor: React.FC<{ y?: number; o?: number }> = ({ y = FLOOR, o = 1 }) => <rect x={60} y={y} width={960} height={2} fill="url(#floorFade)" opacity={o} />;

/** Neon skyline icon for "same city" */
const Skyline: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) => (
  <g transform={`translate(${x},${y})`} opacity={clamp(p * 4)} style={{ filter: neon(C.ink, 0.6) }}>
    <path
      d="M -150 0 L -150 -40 L -120 -40 L -120 -90 L -80 -90 L -80 -55 L -55 -55 L -55 -130 L -15 -130 L -15 -70 L 15 -70 L 15 -105 L 55 -105 L 55 -45 L 85 -45 L 85 -80 L 120 -80 L 120 -30 L 150 -30 L 150 0 Z"
      fill="none" stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" style={draw(1150, p)}
    />
    {[[-108, -70], [-42, -110], [-42, -90], [30, -85], [100, -60]].map(([wx, wy], i) => (
      <rect key={i} x={wx} y={wy} width={8} height={8} fill={C.gold} opacity={clamp(p * 3 - 1.8 - i * 0.1)} />
    ))}
  </g>
);

/** App icons floating up off the phone */
const AppIcons: React.FC<{ t: number; x: number; y: number; from: number; to: number }> = ({ t, x, y, from, to }) => {
  const icons = [
    { c: C.pink, d: "M 0 8 C -14 -2 -16 -14 -8 -18 C -3 -20 0 -16 0 -13 C 0 -16 3 -20 8 -18 C 16 -14 14 -2 0 8 Z" }, // heart
    { c: C.blue, d: "M -10 -14 L 12 0 L -10 14 Z" }, // play
    { c: C.red, d: "M -11 6 L -11 -4 C -11 -12 11 -12 11 -4 L 11 6 L 14 9 L -14 9 Z M -4 12 L 4 12" }, // bell
    { c: C.ink, d: "M -14 -10 L 14 -10 L 14 8 L 0 8 L -8 15 L -8 8 L -14 8 Z" }, // chat
  ];
  const out: React.ReactNode[] = [];
  for (let k = 0; k < 9; k++) {
    const st = from + k * 0.42;
    if (t < st || st > to) continue;
    const a = (t - st) / 1.6;
    if (a > 1) continue;
    const ic = icons[k % icons.length];
    const dx = (random(`ix${k}`) - 0.5) * 140;
    out.push(
      <g key={k} transform={`translate(${x + dx * ease(a)},${y - 40 - 170 * ease(a)}) scale(${0.6 + 0.6 * back(ramp(a, 0, 0.25))})`} opacity={1 - ramp(a, 0.6, 1)} style={{ filter: neon(ic.c, 0.7) }}>
        <rect x={-26} y={-26} width={52} height={52} rx={14} fill="#0b0c12" stroke={ic.c} strokeWidth={3} />
        <path d={ic.d} fill="none" stroke={ic.c} strokeWidth={3.2} strokeLinejoin="round" strokeLinecap="round" />
      </g>,
    );
  }
  return <>{out}</>;
};

/** Lines 01–08: two people, same start. */
export const SceneStage: React.FC<{ t: number }> = ({ t }) => {
  const spotA = flickerOn(t, E.spotA) * flickerOff(t, L("08") + 0.15);
  const spotB = flickerOn(t, E.spotB) * flickerOff(t, L("08") + 0.55);
  const figA = Math.max(0.12, spotA), figB = Math.max(0.12, spotB);

  // camera: push to A on line 03, to B on line 04, back out on line 05
  const pA = easeIO(ramp(t, L("03") - 0.2, L("03") + 0.5)) * (1 - easeIO(ramp(t, L("04") - 0.25, L("04") + 0.4)));
  const pB = easeIO(ramp(t, L("04") - 0.25, L("04") + 0.4)) * (1 - easeIO(ramp(t, L("05") - 0.1, L("05") + 0.7)));
  const zoom = 1 + 0.16 * (pA + pB);
  const fx = lerp(540, AX, pA) + (BX - 540) * pB;
  const fy = 1040;

  // props
  const phone = ease(ramp(t, L("03") + 0.55, L("03") + 0.95));
  const book = ease(ramp(t, L("04") + 0.6, L("04") + 1.05));
  const armA = lerp(0, -150, back(ramp(t, L("03") + 0.4, L("03") + 0.85)));
  const armB = lerp(0, 58, back(ramp(t, L("04") + 0.45, L("04") + 0.9)));
  // scrolling thumb / page turns later on (small arm wiggles)
  const busy = ramp(t, L("05"), L("05") + 0.5);
  const wigA = Math.sin(t * 9) * 4 * busy, wigB = Math.sin(t * 2.4 + 1) * 3 * busy;

  const s02 = L("02");
  const age = ramp(t, s02 + 0.3, s02 + 0.65);
  const city = ramp(t, s02 + 1.15, s02 + 2.2);
  const zero = ramp(t, s02 + 2.15, s02 + 2.5);
  const chipsOut = 1 - ramp(t, L("03") - 0.1, L("03") + 0.2);
  const cityOut = 1 - ramp(t, L("03") - 0.2, L("03") + 0.2);

  // labels under the figures
  const hours = Math.min(6, Math.floor(ramp(t, L("03") + 0.9, LE("05")) * 7));
  const pages = Math.min(20, Math.floor(ramp(t, L("04") + 1, LE("05")) * 21));
  const rolling = t > E.roll30[0];
  const labA = t < L("03") + 0.8 ? "PERSON A" : rolling ? "SCREEN TIME ↑" : `SCREEN TIME ${hours}H`;
  const labB = t < L("04") + 0.9 ? "PERSON B" : rolling ? "PAGES READ ↑" : `PAGES ${pages}`;

  // line 05: magnifier sweeps A -> B, then the "=" lands
  const m = ramp(t, L("05") + 0.3, L("05") + 2.4);
  const mOn = clamp(Math.min(m * 8, (1 - m) * 8 + 0.0)) * (t > L("05") + 0.3 ? 1 : 0);
  const mx = lerp(AX, BX, easeIO(m)), my = 900 + Math.sin(m * Math.PI * 3) * 14;
  const eq = ease(ramp(t, LE("05") - 0.6, LE("05") - 0.2)) * (1 - ramp(t, L("08"), L("08") + 0.4));

  // lights out on "That's the trap": figures go grey
  const trap = ramp(t, L("08") + 0.1, L("08") + 0.8);

  return (
    <g transform={`translate(${fx},${fy}) scale(${zoom}) translate(${-fx},${-fy})`}>
      <Spotlight x={AX} floor={FLOOR} on={spotA} />
      <Spotlight x={BX} floor={FLOOR} on={spotB} />
      <Floor />
      <Skyline x={510} y={845} p={city * cityOut} />
      {city > 0 && <Label x={510} y={885} text="SAME CITY" opacity={clamp(city * 3 - 1.5) * cityOut} />}

      <Figure x={AX} y={FLOOR} s={1.55} t={t} seed={0} arm={armA + wigA} prop="phone" propOn={phone} opacity={figA} glow={figA * (1 - trap * 0.7)} />
      <Figure x={BX} y={FLOOR} s={1.55} t={t} seed={2} arm={armB + wigB} prop="book" propOn={book} opacity={figB} glow={figB * (1 - trap * 0.7)} />
      <AppIcons t={t} x={AX + 20} y={940} from={L("03") + 1.0} to={E.roll100[1]} />

      <Chip x={AX} y={930} text="AGE 21" p={age * chipsOut} />
      <Chip x={BX} y={930} text="AGE 21" p={ramp(t, s02 + 0.4, s02 + 0.75) * chipsOut} />
      {[AX, BX].map((x, i) => {
        const p = ramp(t, s02 + 2.15 + i * 0.1, s02 + 2.5 + i * 0.1) * chipsOut;
        return p > 0 ? (
          <text key={i} x={x} y={870} textAnchor="middle" fill={C.red} opacity={clamp(p * 3)} transform={`translate(0,${(1 - back(p)) * 20})`} style={{ font: `800 64px ${FONT}`, filter: neon(C.red, 0.5) }}>
            $0
          </text>
        ) : null;
      })}
      {zero > 0 && null}

      {mOn > 0 && (
        <g transform={`translate(${mx},${my})`} opacity={mOn} style={{ filter: neon(C.ink, 0.6) }}>
          <circle r={46} fill="rgba(255,255,255,0.06)" stroke={C.ink} strokeWidth={5} />
          <line x1={33} y1={33} x2={72} y2={72} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
        </g>
      )}
      {eq > 0 && (
        <text x={(AX + BX) / 2} y={1080} textAnchor="middle" fill={C.ink} opacity={eq * 0.9} transform={`translate(${(AX + BX) / 2},1060) scale(${back(eq)}) translate(${-(AX + BX) / 2},-1060)`} style={{ font: `800 110px ${FONT}` }}>
          =
        </text>
      )}

      <Label x={AX} y={FLOOR + 58} text={labA} color={phone > 0.5 ? C.blue : C.dim} opacity={figA} />
      <Label x={BX} y={FLOOR + 58} text={labB} color={book > 0.5 ? C.gold : C.dim} opacity={figB} />
    </g>
  );
};

// ---------------- the graph: 1% a day ----------------
const GX0 = 150, GX1 = 930, GY0 = 1160, GY1 = 640, VMAX = 40;
const gx = (d: number) => GX0 + (d / 365) * (GX1 - GX0);
const gy = (v: number) => GY0 - (v / VMAX) * (GY0 - GY1);
const path = (rate: number, D: number) => {
  const n = 90;
  let s = "";
  for (let i = 0; i <= n; i++) {
    const d = (D * i) / n;
    s += `${i ? "L" : "M"} ${gx(d).toFixed(1)} ${gy(Math.pow(rate, d)).toFixed(1)} `;
  }
  return s;
};
/** how many days the graph has drawn at time t (also drives the DAY counter) */
export const graphDays = (t: number) => {
  const a = L("09"), b = LE("09"), c = E.impact;
  if (t < a) return 0;
  if (t < b) return 170 * ramp(t, a, b);
  if (t < c) return 170 + 50 * ramp(t, b, c);
  return 220 + 145 * easeIO(ramp(t, c, c + 0.9));
};

export const SceneGraph: React.FC<{ t: number }> = ({ t }) => {
  const D = graphDays(t);
  const axes = ease(ramp(t, L("09") - 0.15, L("09") + 0.4));
  const hit = ramp(t, E.impact, E.impact + 0.5);
  const shake = t > E.impact && t < E.impact + 0.45 ? (random(`sh${Math.floor(t * 30)}`) - 0.5) * 22 * (1 - hit) : 0;
  const flash = t > E.impact ? Math.exp(-(t - E.impact) * 7) : 0;
  const vUp = Math.pow(1.01, D), vDn = Math.pow(0.99, D);
  const done = ramp(t, E.impact + 0.8, E.impact + 1.1);
  return (
    <g transform={`translate(${shake},${shake * 0.6})`}>
      <ellipse cx={gx(D)} cy={gy(vUp)} rx={220} ry={220} fill="url(#goldGlow)" opacity={0.35 + 0.65 * hit} />
      <g opacity={axes}>
        <line x1={GX0} y1={GY0} x2={GX1 + 20} y2={GY0} stroke={C.ink} strokeWidth={2} opacity={0.6} />
        <line x1={GX0} y1={GY0} x2={GX0} y2={GY1 - 30} stroke={C.ink} strokeWidth={2} opacity={0.6} />
        {[0, 100, 200, 365].map((d) => (
          <g key={d}>
            <line x1={gx(d)} y1={GY0} x2={gx(d)} y2={GY0 + 12} stroke={C.ink} strokeWidth={2} opacity={0.6} />
            <Label x={gx(d)} y={GY0 + 46} text={String(d)} size={22} />
          </g>
        ))}
        <Label x={GX1 + 20} y={GY0 + 86} text="DAYS" size={22} anchor="start" />
        <line x1={GX0} y1={gy(1)} x2={GX1} y2={gy(1)} stroke={C.ink} strokeWidth={1.5} strokeDasharray="6 10" opacity={0.25} />
      </g>
      <path d={path(0.99, D)} fill="none" stroke={C.red} strokeWidth={6} strokeLinecap="round" style={{ filter: neon(C.red, 0.6) }} />
      <path d={path(1.01, D)} fill="none" stroke={C.gold} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" style={{ filter: neon(C.gold, 0.6 + hit * 0.6) }} />
      {D > 0 && (
        <>
          <circle cx={gx(D)} cy={gy(vUp)} r={13} fill={C.gold} style={{ filter: neon(C.gold) }} />
          <circle cx={gx(D)} cy={gy(vDn)} r={11} fill={C.red} style={{ filter: neon(C.red) }} />
          {/* tags ride the line ends, until the end labels take over */}
          <g opacity={1 - done}>
            <Label x={gx(D) - 24} y={gy(vUp) - 62} text="+1% / DAY" color={C.gold} size={24} anchor={D > 250 ? "middle" : "start"} />
            <Label x={gx(D) + 22} y={gy(vDn) - 18} text="−1% / DAY" color={C.red} size={24} anchor="start" />
          </g>
        </>
      )}
      {done > 0 && (
        <>
          <text x={gx(365) - 30} y={gy(37.8) + 6} textAnchor="end" fill={C.gold} opacity={done} transform={`translate(0,${(1 - back(done)) * 16})`} style={{ font: `800 84px ${FONT}`, filter: neon(C.gold, 0.6) }}>
            ×37.8
          </text>
          <text x={gx(365) - 10} y={GY0 - 34} textAnchor="end" fill={C.red} opacity={done} style={{ font: `800 46px ${FONT}`, filter: neon(C.red, 0.4) }}>
            ×0.03
          </text>
        </>
      )}
      <rect x={-50} y={-50} width={1180} height={2020} fill="#fff" opacity={flash * 0.35} />
    </g>
  );
};

// ---------------- the stairs: 37.8 vs 0.03 ----------------
const SX0 = 240, SY0 = FLOOR, STEPS = 9, SW = 62, SH = 40;
const stairPath = (() => {
  let s = `M ${SX0 - 30} ${SY0} L ${SX0} ${SY0} `;
  for (let i = 0; i < STEPS; i++) s += `L ${SX0 + i * SW} ${SY0 - (i + 1) * SH} L ${SX0 + (i + 1) * SW} ${SY0 - (i + 1) * SH} `;
  return s + `L ${SX0 + STEPS * SW + 60} ${SY0 - STEPS * SH}`;
})();
const STAIR_LEN = 30 + STEPS * (SW + SH) + 60;

export const SceneStairs: React.FC<{ t: number }> = ({ t }) => {
  const s11 = L("11"), s12 = L("12"), s13 = L("13");
  const build = ease(ramp(t, s11 - 0.3, s11 + 0.6));
  // B climbs one step at a time during line 11
  const climb = ramp(t, s11 + 0.5, LE("11") + 0.2) * STEPS;
  const k = Math.min(STEPS, Math.floor(climb)), f = climb - k;
  const hop = k < STEPS ? Math.sin(Math.PI * clamp(f / 0.7)) : 0;
  const stepT = k < STEPS ? easeIO(clamp(f / 0.7)) : 0;
  const bx = SX0 + 35 + (k + stepT) * SW;
  const by = SY0 - (k + stepT) * SH - 34 * hop - (k === 0 && stepT === 0 ? 0 : 0);
  const sq = k < STEPS ? 0.06 * Math.max(0, 1 - Math.abs(f - 0.75) * 6) : 0; // squash on landing
  const onTop = ramp(t, LE("11"), LE("11") + 0.6);

  // A fades as line 12 lands
  const fade = easeIO(ramp(t, s12 + 0.5, LE("12")));
  const spotA = 1 - 0.85 * fade;

  const eq1 = ramp(t, s11 + 0.1, s11 + 0.45);
  const v1 = Math.pow(1.01, 365 * easeIO(ramp(t, s11 + 0.3, LE("11") - 0.2)));
  const eq2 = ramp(t, s12 + 0.1, s12 + 0.45);
  const v2 = Math.pow(0.99, 365 * easeIO(ramp(t, s12 + 0.3, LE("12") - 0.3)));
  const tags = ramp(t, s13 - 0.1, s13 + 0.4);

  const Eq: React.FC<{ y: number; p: number; base: string; val: string; color: string }> = ({ y, p, base, val, color }) =>
    p > 0 ? (
      <g opacity={clamp(p * 2.5)} transform={`translate(${(1 - back(p)) * -40},0)`} style={{ filter: neon(color, 0.45) }}>
        <text x={140} y={y} fill={color} style={{ font: `800 92px ${FONT}` }}>
          {base}
          <tspan dy={-42} style={{ font: `800 44px ${FONT}` }}>365</tspan>
          <tspan dy={42}> = {val}</tspan>
        </text>
      </g>
    ) : null;

  return (
    <g>
      <Spotlight x={170} floor={FLOOR} on={spotA} spread={150} />
      <Spotlight x={bx} floor={by} on={ramp(t, L("11") + 0.3, L("11") + 0.8)} spread={140} />
      <Floor />
      <path d={stairPath} fill="none" stroke={C.gold} strokeWidth={5} strokeLinejoin="round" style={{ ...draw(STAIR_LEN, build), filter: neon(C.gold, 0.6) }} />
      <Eq y={760} p={eq1} base="1.01" val={v1.toFixed(1)} color={C.gold} />
      <Eq y={870} p={eq2} base="0.99" val={v2.toFixed(2)} color={C.red} />

      <Figure x={170} y={FLOOR} s={1.3} t={t} seed={0} arm={-150 + Math.sin(t * 9) * 4} prop="phone" propOn={1 - fade * 0.6} color={fade > 0 ? `rgb(${Math.round(lerp(244, 110, fade))},${Math.round(lerp(243, 112, fade))},${Math.round(lerp(238, 122, fade))})` : C.ink} glow={1 - fade} squash={0.05 * fade} />
      <Figure x={bx} y={by} s={1.3} t={t} seed={2} arm={k < STEPS ? 20 : lerp(20, 165, back(onTop))} prop={k < STEPS ? "book" : null} squash={sq} lean={k < STEPS ? 6 * hop : 0} />
      {onTop > 0 && (
        <g opacity={onTop} style={{ filter: neon(C.gold, 0.7) }}>
          {[...Array(6)].map((_, i) => {
            const a = (i / 6) * Math.PI * 2 + 0.3;
            return <line key={i} x1={bx + Math.cos(a) * 70} y1={by - 150 + Math.sin(a) * 70} x2={bx + Math.cos(a) * (70 + 28 * onTop)} y2={by - 150 + Math.sin(a) * (70 + 28 * onTop)} stroke={C.gold} strokeWidth={4} strokeLinecap="round" />;
          })}
        </g>
      )}
      <Chip x={170} y={FLOOR + 62} text="PHONE" p={tags} fill={C.blue} />
      <Chip x={SX0 + STEPS * SW + 10} y={SY0 - STEPS * SH + 62} text="BOOK" p={ramp(t, s13 + 0.6, s13 + 1.0)} fill={C.gold} />
    </g>
  );
};

// ---------------- the end: you, on day one ----------------
export const SceneYou: React.FC<{ t: number }> = ({ t }) => {
  const s = L("14");
  const on = flickerOn(t, s - 0.1);
  const fig = ramp(t, s - 0.05, s + 0.3);
  const youP = ramp(t, s + 1.6, s + 2.0);
  return (
    <g>
      <Spotlight x={540} floor={FLOOR} on={on} spread={210} />
      <Floor />
      <Figure x={540} y={FLOOR} s={1.75} t={t} seed={4} opacity={fig} glow={on} />
      {/* two faint choices on either side */}
      <g opacity={ease(ramp(t, s + 0.5, s + 1.0)) * 0.9}>
        <g transform="translate(300,1030)" style={{ filter: neon(C.blue, 0.6) }}>
          <rect x={-22} y={-38} width={44} height={76} rx={9} fill="#0c1a24" stroke={C.blue} strokeWidth={3.5} />
          <rect x={-14} y={-28} width={28} height={50} rx={3} fill={C.blue} opacity={0.5} />
        </g>
        <g transform="translate(780,1030) scale(1.3)" style={{ filter: neon(C.gold, 0.6) }}>
          <path d="M 0 -18 C -14 -26 -32 -26 -44 -20 L -44 18 C -32 12 -14 12 0 20 Z M 0 -18 C 14 -26 32 -26 44 -20 L 44 18 C 32 12 14 12 0 20 Z" fill="#1d1806" stroke={C.gold} strokeWidth={3} strokeLinejoin="round" />
        </g>
      </g>
      <Label x={540} y={FLOOR + 62} text="YOU" color={C.ink} size={30} opacity={youP} />
    </g>
  );
};
