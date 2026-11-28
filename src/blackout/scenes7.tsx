import React from "react";
import { random } from "remotion";
import { Skyline } from "./scenes5";
import { Coat, GridMap, List, PAPER, Street, Svg } from "./scenes6";
import { C, F, L, LE, T, clamp, ease, easeIO, lerp, ramp } from "./theme7";

type P = { t: number };
const W = 1080;
const H = 1920;
const FLARE = "#ff3b2f";

const Flash: React.FC<{ k: number; color?: string; blend?: boolean }> = ({ k, color = C.red, blend = true }) =>
  k > 0.001 ? <div style={{ position: "absolute", inset: 0, background: color, opacity: k, mixBlendMode: blend ? "screen" : "normal" }} /> : null;
const decay = (t: number, at: number, rate = 4) => (t > at ? Math.exp(-(t - at) * rate) : 0);

/** a jagged bolt of light from (x0,y0) to (x1,y1); seed changes per frame-ish so it crawls */
const bolt = (x0: number, y0: number, x1: number, y1: number, seed: string, jag = 40, segs = 9) => {
  let d = `M ${x0} ${y0}`;
  for (let i = 1; i < segs; i++) {
    const k = i / segs;
    d += ` L ${lerp(x0, x1, k) + (random(`${seed}x${i}`) - 0.5) * jag * 2} ${lerp(y0, y1, k) + (random(`${seed}y${i}`) - 0.5) * jag}`;
  }
  return d + ` L ${x1} ${y1}`;
};

/** Dana: the gray coat, with hair. lit: 0..1 how much flare light falls on her */
const Dana: React.FC<{ x: number; y: number; s: number; lit?: number; o?: number }> = ({ x, y, s, lit = 0, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d="M -86 -350 L 86 -350 L 116 0 L -116 0 Z" fill="#5d6270" />
    <path d="M -86 -350 L 0 -250 L 86 -350 L 66 -372 L 0 -296 L -66 -372 Z" fill="#474b57" />
    <rect x={-17} y={-392} width={34} height={30} fill="#0a0a0d" />
    {/* hair down to the shoulders */}
    <path d="M -54 -430 Q -60 -360 -74 -340 L 74 -340 Q 60 -360 54 -430 Z" fill="#0a0a0d" />
    <ellipse cx={0} cy={-428} rx={44} ry={54} fill="#0a0a0d" />
    <ellipse cx={0} cy={-428} rx={46} ry={56} fill="none" stroke={FLARE} strokeWidth={3} opacity={0.8 * lit} />
    <path d="M -86 -350 L -116 0" stroke={FLARE} strokeWidth={4} opacity={0.6 * lit} />
    {/* her eyes: normal. a glint, no glow */}
    <circle cx={-15} cy={-430} r={3.5} fill="#d9dce4" opacity={0.5 + 0.5 * lit} />
    <circle cx={15} cy={-430} r={3.5} fill="#d9dce4" opacity={0.5 + 0.5 * lit} />
  </g>
);

/* 0 → line 03: the dark city, a hand on a breaker. On "back on", everything lights. Then it's gone. */
export const SceneHook: React.FC<P> = ({ t }) => {
  const on = t >= LE("01") - 0.1 && t < L("02") + 0.35;
  const flash = decay(t, LE("01") - 0.1, 5);
  const slam = decay(t, L("02") + 0.1, 4);
  const push = lerp(1.0, 1.22, easeIO(ramp(t, 0, L("03"))));
  const glow = ramp(t, 0.2, LE("01"));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "540px 900px" }}>
        <Skyline wave={on ? 0 : 1} t={t} />
      </div>
      {/* the hum in the wires, building under the city */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 540px 1300px, rgba(229,36,59,${0.3 * glow * (on ? 0 : 1)}), transparent 60%)` }} />
      <Flash k={flash * 0.85} color="#fff6e0" />
      <Flash k={slam * 0.4} />
      {t > L("02") + 0.35 && <div style={{ position: "absolute", inset: 0, background: "#000", opacity: ease(ramp(t, L("02") + 0.4, LE("02") + 0.4)) * 0.4 }} />}
    </div>
  );
};

/* line 03 → 06: who I am, what I did, and last night */
export const SceneRecap: React.FC<P> = ({ t }) => {
  if (t < L("04")) {
    const k = ease(ramp(t, L("03") - 0.1, L("03") + 0.5));
    const k2 = ease(ramp(t, L("03") + 1.2, L("03") + 1.8));
    return (
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 45%, #161b2c, #05060a 70%)` }}>
        <div style={{ position: "absolute", top: 560, width: W, textAlign: "center", fontFamily: F.display, fontSize: 210, color: C.ink, letterSpacing: 6, opacity: k, transform: `scale(${lerp(1.2, 1, k)})` }}>MARK</div>
        <div style={{ position: "absolute", top: 820, width: W, display: "flex", justifyContent: "center", opacity: k2 }}>
          <div style={{ padding: "14px 30px", background: C.red, color: "#fff", fontFamily: F.body, fontWeight: 800, fontSize: 40, letterSpacing: 5 }}>NIGHT SUPERVISOR · ID 0914-N</div>
        </div>
      </div>
    );
  }
  if (t < L("05")) {
    const spread = ramp(t, L("04") + 0.2, L("04") + 1.8);
    const off = ramp(t, L("04") + 2.0, LE("04"));
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1.05, 1.15, ramp(t, L("04"), L("05")))})`, transformOrigin: "540px 960px" }}>
          <GridMap t={t} spread={spread} off={off * 1.2} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(transparent 0 3px, rgba(0,0,0,.25) 3px 4px)" }} />
      </div>
    );
  }
  const eyes = ease(ramp(t, L("05") + 2.0, L("05") + 2.6));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1, 1.12, ramp(t, L("05"), L("06")))})`, transformOrigin: "540px 700px" }}>
        <Street t={t} man={1} glare={1} rim={0.9} manScale={2.3} eyes={eyes} veins={eyes} />
      </div>
    </div>
  );
};

/* line 06 → 08: his voice, then his hand on my wrist, light crawling under the skin */
export const SceneGrip: React.FC<P> = ({ t }) => {
  if (t < L("07")) {
    const push = lerp(1.1, 1.45, easeIO(ramp(t, L("06"), L("07"))));
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "540px 640px" }}>
          <Street t={t} man={1} glare={0.6} rim={0.9} manScale={2.3} eyes={1} veins={1} />
        </div>
        <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 300px rgba(229,36,59,${0.2 + 0.08 * Math.sin(t * 6)})` }} />
      </div>
    );
  }
  const crawl = ramp(t, L("07") + 0.6, LE("07") + 0.3);
  const shake = Math.sin(t * 40) * 3 * crawl;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#07080c", overflow: "hidden" }}>
      <Svg style={{ transform: `translate(${shake}px, 0) scale(${lerp(1, 1.15, ramp(t, L("07"), L("08")))})`, transformOrigin: "540px 900px" }}>
        {/* my forearm, left to right */}
        <path d="M -40 760 L 700 820 L 700 1000 L -40 1060 Z" fill="#3a3530" />
        <path d="M 700 820 Q 820 830 860 900 Q 820 990 700 1000 Z" fill="#3a3530" />
        {/* his hand closing over the wrist, from above */}
        <path d="M 470 520 Q 560 520 600 620 L 640 830 Q 660 1010 560 1050 L 480 1060 Q 420 980 430 840 Z" fill="#14151b" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M ${480 + i * 40} 1040 q 10 40 -10 70`} stroke="#14151b" strokeWidth={34} strokeLinecap="round" fill="none" />
        ))}
        {/* the current, crawling up the veins */}
        {Array.from({ length: 5 }).map((_, i) => (
          <path key={i} d={bolt(520, 900 + i * 25, -40, 860 + i * 40, `v${i}${Math.floor(t * 14)}`, 18, 12)} fill="none" stroke="#ff6b7a" strokeWidth={4}
            strokeDasharray={700} strokeDashoffset={700 * (1 - clamp(crawl * 1.4 - i * 0.1))} opacity={0.85} />
        ))}
      </Svg>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 540px 900px, rgba(229,36,59,${0.25 * crawl}), transparent 55%)` }} />
    </div>
  );
};

/* line 08 → 11: a flare bounces across the asphalt. Her, lit red. Run. */
export const SceneFlare: React.FC<P> = ({ t }) => {
  const fly = ramp(t, L("08") + 0.6, L("08") + 1.0);
  const lit = ease(ramp(t, L("08") + 0.9, L("08") + 1.3));
  const fl = 0.85 + 0.15 * random(`fl${Math.floor(t * 24)}`);
  const her = t >= L("09") - 0.15;
  const push = her ? lerp(1, 1.25, easeIO(ramp(t, L("09"), LE("10")))) : 1;
  const fx = lerp(1100, 560, fly), fy = lerp(800, 1500, fly) - Math.sin(fly * Math.PI) * 300;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "540px 900px" }}>
        {!her ? (
          <Street t={t} man={1} glare={1 - lit * 0.4} rim={0.9} manScale={1.8} eyes={1} veins={1} />
        ) : (
          <Svg>
            <rect width={W} height={H} fill="#0b0405" />
            {[[0, 380, 260], [240, 520, 220], [470, 300, 200], [660, 460, 240], [880, 350, 200]].map(([x, y, w], i) => (
              <rect key={i} x={x} y={y} width={w} height={1100 - y} fill="#160809" />
            ))}
            <rect y={1100} width={W} height={820} fill="#120607" />
            <Dana x={540} y={1650} s={2.2} lit={fl} />
          </Svg>
        )}
      </div>
      {/* the flare itself, and the red it throws on everything */}
      {fly > 0 && (
        <Svg>
          <circle cx={fx} cy={fy} r={14} fill="#fff1e0" />
          <circle cx={fx} cy={fy} r={60 * fl} fill={FLARE} opacity={0.5} />
        </Svg>
      )}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${fx}px ${fy}px, rgba(255,59,47,${0.45 * lit * fl}), transparent 70%)`, mixBlendMode: "screen" }} />
      <Flash k={decay(t, L("08") + 1.0, 6) * 0.5} color={FLARE} />
      {t > L("10") && <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 260px rgba(255,59,47,${0.3 * fl})` }} />}
    </div>
  );
};

/* line 11 → 12: running. Dead streetlights whipping past, headlights shrinking behind */
export const SceneRun: React.FC<P> = ({ t }) => {
  const bob = Math.sin(t * 21.7) * 22;
  const sway = Math.sin(t * 10.8) * 14;
  const fade = 1 - ramp(t, LE("11") - 0.6, LE("11"));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#050609", overflow: "hidden" }}>
      <Svg style={{ transform: `translate(${sway}px, ${bob}px) rotate(${sway * 0.08}deg) scale(1.1)`, transformOrigin: "540px 960px" }}>
        <rect y={1050} width={W} height={870} fill="#0d0f15" />
        <ellipse cx={540} cy={1060} rx={500} ry={60} fill="#fff1c4" opacity={0.06} />
        {/* streetlight poles rushing past on both sides */}
        {Array.from({ length: 6 }).map((_, i) => {
          const z = ((t * 1.6 + i / 6) % 1); const s = 0.15 + z * z * 3;
          return [-1, 1].map((side) => (
            <rect key={`${i}${side}`} x={540 + side * (60 + 700 * z * z) - 6 * s} y={1050 - 900 * s * 0.45} width={12 * s} height={900 * s * 0.5} fill="#2a2e3b" opacity={clamp(z * 3)} />
          ));
        })}
        {/* the trucks, far behind, two pairs of lights */}
        {[-1, 1].map((s) => <circle key={s} cx={540 + s * 26} cy={1060} r={10 * fade} fill="#fff1c4" opacity={0.7 * fade} />)}
      </Svg>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 60%, rgba(0,0,0,.6))" }} />
    </div>
  );
};

/* line 12 → 16: under a dead streetlight, her name; the day the current went through me; the notebook */
export const SceneDana: React.FC<P> = ({ t }) => {
  if (t < L("14")) {
    const push = lerp(1, 1.3, easeIO(ramp(t, L("12"), L("14"))));
    const name = ease(ramp(t, L("13"), L("13") + 0.6));
    return (
      <div style={{ position: "absolute", inset: 0, background: "#050609", overflow: "hidden" }}>
        <Svg style={{ transform: `scale(${push})`, transformOrigin: "540px 700px" }}>
          {/* the dead streetlight overhead, and the last of the flare in her hand */}
          <rect x={790} y={0} width={18} height={1700} fill="#14161d" />
          <path d="M 799 260 Q 790 200 620 210 L 600 230" stroke="#14161d" strokeWidth={16} fill="none" />
          <Dana x={500} y={1900} s={2.4} lit={0.35 + 0.05 * Math.sin(t * 13)} />
        </Svg>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 300px 1500px, rgba(255,59,47,${0.22 + 0.03 * Math.sin(t * 13)}), transparent 60%)` }} />
        <div style={{ position: "absolute", top: 440, width: W, textAlign: "center", fontFamily: F.display, fontSize: 130, letterSpacing: 10, color: C.ink, opacity: name * 0.95 }}>DANA</div>
        <div style={{ position: "absolute", top: 600, width: W, textAlign: "center", fontFamily: F.body, fontWeight: 800, fontSize: 32, letterSpacing: 6, color: C.sub, opacity: name * 0.8 }}>DAY SUPERVISOR · CITY GRID CONTROL</div>
      </div>
    );
  }
  if (t < L("15")) {
    // memory: day one, the control room, a bolt from the panel into him
    const zap = clamp(ramp(t, L("14") + 1.4, L("14") + 1.6) - ramp(t, L("14") + 2.3, L("14") + 3.2));
    const white = decay(t, L("14") + 1.4, 3);
    const gone = ramp(t, L("14") + 2.4, LE("14"));
    return (
      <div style={{ position: "absolute", inset: 0, background: "#04050a", overflow: "hidden" }}>
        <Svg style={{ filter: `grayscale(${0.6 + 0.4 * gone}) blur(${gone * 6}px)`, opacity: 1 - gone * 0.6 }}>
          <rect x={60} y={420} width={960} height={520} rx={12} fill="#111521" />
          {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={90 + (i % 3) * 310} y={450 + Math.floor(i / 3) * 240} width={280} height={220} fill="#4a0b14" />)}
          <Coat x={540} y={1650} s={2.0} rim={0.6} />
          {zap > 0 && [0, 1, 2].map((i) => (
            <path key={i} d={bolt(300 + i * 240, 940, 540, 820 + 300, `z${i}${Math.floor(t * 20)}`, 60, 10)} stroke="#f4f6ff" strokeWidth={8 - i * 2} fill="none" opacity={zap} />
          ))}
        </Svg>
        <Flash k={white * 0.9} color="#f4f6ff" blend={false} />
      </div>
    );
  }
  // the notebook, pages flipping, her handwriting night after night
  const flip = ramp(t, L("15") + 1.2, LE("15"));
  const page = Math.floor(flip * 7);
  const entries = ["Day 1. Your name is Mark.", "Day 2. You turned it off. On purpose.", "Day 3. Don't trust the radio.", "Day 4. Don't get in the trucks.", "Day 5. You wrote the list.", "Day 6. Look at his eyes.", "Day 7. I'm still here."];
  return (
    <div style={{ position: "absolute", inset: 0, background: "#07080c", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 540px 260px, rgba(255,241,196,.14), transparent 60%)` }} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1.05, 1.2, ramp(t, L("15"), L("16")))}) rotate(-3deg)`, transformOrigin: "540px 900px" }}>
        <div style={{ position: "absolute", left: 80, top: 420, width: 920, height: 1100, ...PAPER, boxShadow: "0 40px 120px rgba(0,0,0,.9)" }}>
          <div style={{ position: "absolute", left: 150, right: 40, top: 150, fontFamily: F.pencil, fontSize: 100, color: "#1f2230", lineHeight: "121px" }}>{entries[Math.min(6, page)]}</div>
        </div>
        {flip > 0 && flip < 1 && (
          <div style={{ position: "absolute", left: 80, top: 420, width: 920, height: 1100, ...PAPER, transformOrigin: "0 50%", transform: `perspective(1800px) rotateY(${-((flip * 7) % 1) * 170}deg)`, filter: "brightness(.8)" }} />
        )}
      </div>
    </div>
  );
};

/** Wrigley: a bowl of stands under light towers. eyes 0..1 red glow; cured 0..1 turns them normal */
const Stadium: React.FC<{ t: number; eyes: number; cured?: number; close?: number }> = ({ t, eyes, cured = 0, close = 0 }) => {
  const rows = 9, per = 16;
  return (
    <Svg>
      <rect width={W} height={H} fill="#05060a" />
      {/* the floodlight towers */}
      {[150, 930].map((x) => (
        <g key={x}>
          <rect x={x - 8} y={260} width={16} height={700} fill="#1a1c24" />
          <rect x={x - 90} y={220} width={180} height={70} fill="#fffbea" />
          <ellipse cx={x} cy={300} rx={420} ry={260} fill="#fffbea" opacity={0.08} />
        </g>
      ))}
      {/* the stands: rows of seated figures, each with two eyes */}
      {Array.from({ length: rows }).map((_, r) => {
        const y = 760 + r * lerp(70, 92, close), s = lerp(0.55, 1.1, r / (rows - 1)) * lerp(1, 1.4, close);
        return Array.from({ length: per }).map((__, c) => {
          const x = 540 + (c - per / 2 + 0.5 + (r % 2) * 0.5) * 70 * s;
          if (x < -60 || x > W + 60) return null;
          const ready = cured >= random(`cu${r}${c}`) * 0.9;
          const e = eyes * (ready ? 0 : 1);
          return (
            <g key={`${r}${c}`} transform={`translate(${x} ${y}) scale(${s})`}>
              <path d="M -26 40 Q -24 4 0 2 Q 24 4 26 40 Z" fill="#101219" />
              <circle cx={0} cy={-14} r={15} fill="#101219" />
              <circle cx={-5} cy={-15} r={e > 0 ? 3.6 : 1.8} fill={e > 0 ? "#fff4f0" : "#c9ccd8"} opacity={e > 0 ? e : 0.55 * cured} />
              <circle cx={5} cy={-15} r={e > 0 ? 3.6 : 1.8} fill={e > 0 ? "#fff4f0" : "#c9ccd8"} opacity={e > 0 ? e : 0.55 * cured} />
              {e > 0 && <circle cx={0} cy={-15} r={12} fill={C.red} opacity={0.3 * e * (0.8 + 0.2 * Math.sin(t * 3 + c))} />}
            </g>
          );
        });
      })}
      <rect y={1600} width={W} height={320} fill="#030305" />
    </Svg>
  );
};

/* line 16 → 22: she points north. One light in the whole city. Wrigley. Forty thousand, lit. */
export const SceneNorth: React.FC<P> = ({ t }) => {
  if (t < L("18")) {
    const arm = ease(ramp(t, L("17") - 0.1, L("17") + 0.5));
    return (
      <div style={{ position: "absolute", inset: 0, background: "#050609", overflow: "hidden" }}>
        <Svg>
          <rect width={W} height={H} fill="#060812" />
          {[[0, 700, 200], [180, 760, 160], [700, 720, 180], [880, 680, 200]].map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height={1300 - y} fill="#0c0e16" />)}
          {/* a pale glow on the clouds, far off to the north */}
          <ellipse cx={540} cy={720} rx={240} ry={90} fill="#fffbea" opacity={0.12 * arm} />
          <g transform="translate(300 1800) scale(2.2)">
            <Dana x={0} y={0} s={1} lit={0.2} />
            <path d={`M 70 -320 L ${lerp(90, 200, arm)} ${lerp(-200, -420, arm)}`} stroke="#5d6270" strokeWidth={30} strokeLinecap="round" />
          </g>
        </Svg>
      </div>
    );
  }
  if (t < L("20")) {
    const reveal = ease(ramp(t, L("19") + 0.15, L("19") + 0.5));
    const push = lerp(1, 1.5, easeIO(ramp(t, L("18"), L("20"))));
    return (
      <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "540px 820px" }}>
          <Skyline wave={1} t={t} />
          {/* Wrigley, the one place still lit */}
          <Svg>
            <ellipse cx={540} cy={1150} rx={300} ry={90} fill="#fffbea" opacity={0.15 + 0.35 * reveal} />
            <path d="M 300 1160 Q 540 1060 780 1160 L 760 1220 L 320 1220 Z" fill="#1a1c24" />
            {[340, 740].map((x) => (
              <g key={x}>
                <rect x={x - 3} y={1000} width={6} height={160} fill="#1a1c24" />
                <rect x={x - 26} y={990} width={52} height={20} fill="#fffbea" opacity={0.4 + 0.6 * reveal} />
              </g>
            ))}
          </Svg>
        </div>
        <Flash k={decay(t, L("19") + 0.2, 5) * 0.4} color="#fffbea" />
        <div style={{ position: "absolute", top: 560, width: W, textAlign: "center", fontFamily: F.display, fontSize: 120, letterSpacing: 8, color: C.ink, opacity: reveal * (1 - ramp(t, L("20") - 0.5, L("20"))) }}>WRIGLEY FIELD</div>
      </div>
    );
  }
  const eyes = ease(ramp(t, L("21") + 0.9, L("21") + 1.6));
  const close = easeIO(ramp(t, L("20"), L("22")));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1, 1.25, close)})`, transformOrigin: "540px 1000px" }}>
        <Stadium t={t} eyes={eyes} close={close} />
      </div>
      <Flash k={decay(t, L("21") + 1.0, 3) * 0.35} />
    </div>
  );
};

/* line 22 → 24: Dana, close. It's been keeping them. */
export const SceneWarning: React.FC<P> = ({ t }) => {
  const push = lerp(1.2, 1.55, easeIO(ramp(t, L("22"), L("24"))));
  const beat = 0.5 + 0.5 * Math.sin(t * 7.5);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#050609", overflow: "hidden" }}>
      <Svg style={{ transform: `scale(${push})`, transformOrigin: "540px 760px" }}>
        <Dana x={540} y={1720} s={2.4} lit={0.25} />
      </Svg>
      {/* the stadium glow reflected in her eyes on "every house at once" */}
      <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 300px rgba(229,36,59,${0.12 + 0.12 * beat})` }} />
    </div>
  );
};

/* line 24 → 27: the plan. Every line in the city, routed into one. */
export const ScenePlan: React.FC<P> = ({ t }) => {
  const route = ease(ramp(t, L("25"), LE("25")));
  const flow = t * 600;
  const target = { x: 540, y: 560 };
  const lines = Array.from({ length: 14 }, (_, i) => ({ x: 80 + (i % 7) * 150, y: 1000 + Math.floor(i / 7) * 260 }));
  const slam = decay(t, LE("26") - 0.1, 4);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#030812", overflow: "hidden" }}>
      <Svg style={{ transform: `scale(${lerp(1, 1.12, ramp(t, L("24"), L("27")))})`, transformOrigin: "540px 800px" }}>
        {lines.map((p, i) => (
          <g key={i}>
            <path d={`M ${p.x} ${p.y} L ${p.x} ${lerp(p.y, 800, route)} L ${lerp(p.x, target.x, route)} ${lerp(p.y, 800, route)} L ${target.x} ${target.y}`} stroke="#1b3a55" strokeWidth={5} fill="none" />
            <path d={`M ${p.x} ${p.y} L ${p.x} ${lerp(p.y, 800, route)} L ${lerp(p.x, target.x, route)} ${lerp(p.y, 800, route)} L ${target.x} ${target.y}`} stroke={C.warm} strokeWidth={6} fill="none"
              strokeDasharray="40 60" strokeDashoffset={-flow} opacity={0.3 + 0.7 * route} />
            <rect x={p.x - 22} y={p.y - 22} width={44} height={44} rx={4} fill="#0b0f18" stroke="#1b3a55" strokeWidth={3} />
          </g>
        ))}
        <circle cx={target.x} cy={target.y} r={50 + 40 * route + 10 * Math.sin(t * 12) * route} fill={C.red} opacity={0.35 + 0.5 * route} />
        <circle cx={target.x} cy={target.y} r={28} fill="#fff4f0" />
        <text x={target.x} y={target.y - 100} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={40} letterSpacing={6} fill={C.ink}>WRIGLEY</text>
      </Svg>
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(transparent 0 3px, rgba(0,0,0,.25) 3px 4px)" }} />
      <Flash k={slam * 0.45} />
    </div>
  );
};

/* line 27 → 30: the control room. The code. His voice on the radio. */
export const SceneCode: React.FC<P> = ({ t }) => {
  if (t < L("28")) {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#04050a", overflow: "hidden" }}>
        <Svg style={{ transform: `scale(${lerp(1, 1.12, ramp(t, L("27"), L("28")))})`, transformOrigin: "540px 1300px" }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const x = 90 + (i % 3) * 310, y = 420 + Math.floor(i / 3) * 260;
            return <g key={i}><rect x={x} y={y} width={280} height={230} rx={8} fill="#111521" /><rect x={x + 12} y={y + 12} width={256} height={206} fill="#06080d" /></g>;
          })}
          <rect y={1500} width={W} height={420} fill="#020204" />
          {/* my chair, still pushed in */}
          <rect x={410} y={1300} width={260} height={230} rx={24} fill="#0d0e13" />
          <rect x={530} y={1530} width={20} height={120} fill="#0d0e13" />
        </Svg>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 540px 400px, rgba(140,170,255,.08), transparent 60%)" }} />
      </div>
    );
  }
  const s28 = L("28"), d28 = LE("28") - s28;
  const typed = [0, 1, 2, 3].filter((k) => t >= s28 + d28 * (0.52 + k * 0.12)).length;
  const radio = t >= L("29") - 0.15;
  const led = radio && Math.floor(t * 6) % 2 === 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#05060a", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1, 1.1, ramp(t, L("28"), L("30")))})`, transformOrigin: "540px 800px" }}>
        {/* the readout */}
        <div style={{ position: "absolute", left: 140, right: 140, top: 430, height: 200, background: "#0a1a12", border: "6px solid #1a1d25", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 40 }}>
          {["0", "9", "1", "4"].map((d, i) => (
            <div key={i} style={{ fontFamily: F.display, fontSize: 140, color: i < typed ? "#4fd17a" : "#163323", textShadow: i < typed ? "0 0 30px rgba(79,209,122,.6)" : "none" }}>{i < typed ? d : "_"}</div>
          ))}
        </div>
        {/* keypad */}
        <div style={{ position: "absolute", left: 240, top: 690, width: 600, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""].map((k, i) => {
            const hot = typed > 0 && k === ["0", "9", "1", "4"][typed - 1] && t < s28 + d28 * (0.52 + (typed - 1) * 0.12) + 0.2;
            return k ? (
              <div key={i} style={{ height: 70, borderRadius: 12, background: hot ? "#c9ccd1" : "#1a1d25", color: hot ? "#05060a" : C.sub, fontFamily: F.body, fontWeight: 800, fontSize: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>{k}</div>
            ) : <div key={i} />;
          })}
        </div>
      </div>
      {/* the radio on the desk, his voice */}
      {radio && (
        <>
          <div style={{ position: "absolute", left: 760, top: 1420, width: 150, height: 260, borderRadius: 20, background: "#121319", border: "4px solid #22242c" }}>
            <div style={{ position: "absolute", left: 60, top: -90, width: 20, height: 100, background: "#121319" }} />
            <div style={{ position: "absolute", left: 55, top: 30, width: 40, height: 40, borderRadius: 20, background: led ? C.red : "#3a0a10", boxShadow: led ? "0 0 30px #E5243B" : "none" }} />
            {Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ position: "absolute", left: 25, right: 25, top: 110 + i * 24, height: 8, background: "#22242c" }} />)}
          </div>
          <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 300px rgba(229,36,59,${0.15 + 0.1 * Math.sin(t * 6)})` }} />
        </>
      )}
    </div>
  );
};

/* line 30 → 32: I pulled the breaker. And I didn't let go. */
export const SceneBreaker: React.FC<P> = ({ t }) => {
  const pull = ease(ramp(t, L("30") + 0.3, L("30") + 0.6));
  const surge = ramp(t, L("30") + 0.6, LE("31") + 0.6);
  const white = ramp(t, LE("31") - 0.4, LE("31") + 0.6);
  const shake = (random(`sh${Math.floor(t * 30)}`) - 0.5) * 30 * surge;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#07080c", overflow: "hidden" }}>
      <Svg style={{ transform: `translate(${shake}px, ${shake * 0.6}px) scale(${lerp(1, 1.3, surge)})`, transformOrigin: "540px 900px" }}>
        <rect x={240} y={420} width={600} height={1000} rx={30} fill="#1a1d25" />
        <text x={540} y={500} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={36} letterSpacing={6} fill={C.red}>MAIN · ALL SECTORS</text>
        <rect x={500} y={560} width={80} height={760} rx={20} fill="#0d0f14" />
        {/* the handle, and my hand around it */}
        <g transform={`translate(540 ${lerp(640, 1180, pull)})`}>
          <rect x={-190} y={-40} width={380} height={80} rx={20} fill="#c9ccd1" />
          <path d="M -120 -60 Q 0 -90 120 -60 L 130 60 Q 0 90 -130 60 Z" fill="#3a3530" />
          <path d="M -120 60 L -260 600 L 60 600 L 130 60 Z" fill="#3a3530" />
        </g>
        {/* the current through the arm */}
        {surge > 0 && Array.from({ length: 7 }).map((_, i) => (
          <path key={i} d={bolt(540 + (i - 3) * 30, lerp(640, 1180, pull), 400 + i * 60, 1920, `b${i}${Math.floor(t * 24)}`, 50, 12)} stroke={i % 2 ? "#ffe9a8" : "#f4f6ff"} strokeWidth={6} fill="none" opacity={clamp(surge * 2 - i * 0.12)} />
        ))}
      </Svg>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 540px 1000px, rgba(255,233,168,${0.5 * surge}), transparent 70%)`, mixBlendMode: "screen" }} />
      <Flash k={white} color="#fffdf4" blend={false} />
    </div>
  );
};

/* line 32 → 36: the lights come back. Normal eyes. A boy walking home. */
export const SceneLights: React.FC<P> = ({ t }) => {
  if (t < L("33")) {
    const wake = 1 - ramp(t, L("32") + 1.4, LE("32") + 0.2);
    const fromWhite = 1 - ramp(t, L("32") - 0.3, L("32") + 0.8);
    return (
      <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1.2, 1.0, easeIO(ramp(t, L("32"), L("33"))))})`, transformOrigin: "540px 900px" }}>
          <Skyline wave={wake} t={t} />
        </div>
        <Flash k={fromWhite} color="#fffdf4" blend={false} />
      </div>
    );
  }
  if (t < L("35")) {
    const cured = ease(ramp(t, L("33") + 1.0, L("34") + 0.4));
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1.25, 1.4, ramp(t, L("33"), L("35")))})`, transformOrigin: "540px 1000px" }}>
          <Stadium t={t} eyes={1} cured={cured} close={1} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: `rgba(255,241,196,${0.05 * cured})` }} />
      </div>
    );
  }
  // 7B. The door opens, a kid in the warm light. Mrs. Alvarez's arms.
  const open = ease(ramp(t, L("35") + 0.3, L("35") + 1.4));
  const hug = ease(ramp(t, L("35") + 1.6, LE("35") + 0.3));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0c0a08", overflow: "hidden" }}>
      <Svg style={{ transform: `scale(${lerp(1, 1.1, ramp(t, L("35"), L("36")))})`, transformOrigin: "540px 1100px" }}>
        <rect width={W} height={H} fill="#16120d" />
        <rect x={300} y={500} width={480} height={1100} fill={C.warm} opacity={0.85 * open} />
        <text x={540} y={460} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={48} fill="#6d5c45">7B</text>
        {/* the door swinging in */}
        <path d={`M 300 500 L ${lerp(780, 330, open)} ${lerp(500, 540, open)} L ${lerp(780, 330, open)} ${lerp(1600, 1560, open)} L 300 1600 Z`} fill="#3a2a1c" />
        {/* her, and the boy coming into her arms */}
        <g transform={`translate(${lerp(640, 600, hug)} 1600)`}>
          <path d="M -90 0 Q -80 -280 0 -290 Q 80 -280 90 0 Z" fill="#1d1712" />
          <ellipse cx={0} cy={-350} rx={55} ry={65} fill="#1d1712" />
        </g>
        <g transform={`translate(${lerp(420, 520, hug)} 1600)`}>
          <path d="M -60 0 Q -55 -190 0 -200 Q 55 -190 60 0 Z" fill="#1d1712" />
          <ellipse cx={0} cy={-245} rx={42} ry={50} fill="#1d1712" />
        </g>
      </Svg>
    </div>
  );
};

/* line 36 → silence: the notebook on the floor; the last line; three flickers; a name ticked off */
export const SceneLast: React.FC<P> = ({ t }) => {
  if (t < L("38")) {
    const w = ramp(t, L("37") + 0.6, LE("37") + 0.6);
    return (
      <div style={{ position: "absolute", inset: 0, background: "#07080c", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 540px 240px, rgba(255,241,196,.16), transparent 60%)" }} />
        <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1.0, 1.25, easeIO(ramp(t, L("36"), L("38"))))}) rotate(4deg)`, transformOrigin: "540px 900px" }}>
          <div style={{ position: "absolute", left: 80, top: 420, width: 920, height: 1100, ...PAPER, boxShadow: "0 40px 120px rgba(0,0,0,.9)" }}>
            <div style={{ position: "absolute", left: 150, top: 60, fontFamily: F.pencil, fontSize: 64, color: "#1f2230", opacity: 0.35, lineHeight: "121px" }}>Day 7. I&apos;m still here.</div>
            <div style={{ position: "absolute", left: 150, right: 40, top: 300, fontFamily: F.pencil, fontSize: 92, color: "#14161d", lineHeight: "121px", clipPath: `inset(0 0 ${100 - w * 100}% 0)` }}>
              If your lights ever flicker three times, don&apos;t be scared.
              <br />— M.
            </div>
          </div>
        </div>
      </div>
    );
  }
  // a kitchen lamp in a lit apartment. Three flickers on "three times", then the list, and the last tick.
  const s = L("38");
  const off = [0, 1, 2].some((k) => t >= s + 1.2 + k * 0.35 && t < s + 1.2 + k * 0.35 + 0.12);
  if (t < L("39") + 0.6) {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#0b0a08", overflow: "hidden" }}>
        <Svg style={{ transform: `scale(${lerp(1, 1.12, ramp(t, s, L("39") + 0.6))})`, transformOrigin: "540px 700px" }}>
          <rect width={W} height={H} fill={off ? "#050505" : "#2a2218"} />
          <line x1={540} y1={0} x2={540} y2={520} stroke="#111" strokeWidth={6} />
          <path d="M 400 520 L 680 520 L 620 440 L 460 440 Z" fill="#111" />
          <circle cx={540} cy={545} r={34} fill={off ? "#1a1a1a" : "#fff3d0"} />
          {!off && <ellipse cx={540} cy={1200} rx={520} ry={700} fill={C.warm} opacity={0.18} />}
          <rect y={1450} width={W} height={470} fill={off ? "#030303" : "#1a140d"} />
        </Svg>
      </div>
    );
  }
  const tick = ease(ramp(t, L("39") + 1.0, L("39") + 1.6));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#060407", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1, 1.12, ramp(t, L("39") + 0.6, T.silenceStart))})`, transformOrigin: "540px 1000px" }}>
        <List write={1} strike={0} style={{ top: 240 }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* a red check mark, drawing itself next to the last name */}
          <path d="M 850 930 L 895 985 L 990 855" fill="none" stroke={C.red} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={260} strokeDashoffset={260 * (1 - tick)} transform="rotate(3 540 850)" />
        </svg>
      </div>
      <Flash k={decay(t, LE("39") - 0.1, 3) * 0.35} />
    </div>
  );
};

/* End card: the end of the series */
export const EndCard7: React.FC<P> = ({ t }) => {
  const s = T.endCardStart;
  const k = ease(ramp(t, s, s + 0.7));
  const k2 = ease(ramp(t, s + 0.8, s + 1.4));
  const k3 = ease(ramp(t, s + 1.4, s + 2.0));
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 38%, #1A1F33 0%, ${C.bg} 62%)` }}>
      <div style={{ position: "absolute", top: 520, width: W, textAlign: "center", fontFamily: F.body, fontWeight: 800, fontSize: 40, letterSpacing: 10, color: C.sub, opacity: k }}>BLACKOUT</div>
      <div style={{ position: "absolute", top: 600, width: W, textAlign: "center", fontFamily: F.display, fontSize: 190, lineHeight: 1, letterSpacing: 6, color: C.ink, opacity: k, transform: `translateY(${lerp(30, 0, k)}px)` }}>
        THE <span style={{ color: C.red }}>END</span>
      </div>
      <div style={{ position: "absolute", top: 860, width: W, textAlign: "center", fontFamily: F.body, fontWeight: 700, fontStyle: "italic", fontSize: 40, color: C.sub, opacity: k2 }}>
        leave your lights on.
      </div>
      <div style={{ position: "absolute", top: 990, width: W, display: "flex", justifyContent: "center", opacity: k3 }}>
        <div style={{ padding: "14px 34px", borderRadius: 14, background: C.red, fontFamily: F.body, fontWeight: 800, fontSize: 40, letterSpacing: 4, color: "#fff" }}>WATCH FROM PART 1</div>
      </div>
      <div style={{ position: "absolute", top: 1100, width: W, textAlign: "center", fontFamily: F.body, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: C.sub, opacity: k3 }}>
        WOULD YOU HAVE PULLED IT?
      </div>
    </div>
  );
};
