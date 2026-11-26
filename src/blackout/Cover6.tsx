import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { C, F } from "./theme";

/** Part 6 thumbnail: the man in the gray coat, headlights behind him, eyes lit from the inside. */
export const Cover6: React.FC = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(["400 10px Anton", "800 10px Montserrat", "700 10px Montserrat"].map((f) => document.fonts.load(f))).then(() => continueRender(handle));
  }, [handle]);

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="c6hl">
            <stop offset="0" stopColor="#fffbea" stopOpacity={1} />
            <stop offset="0.3" stopColor="#fff1c4" stopOpacity={0.45} />
            <stop offset="1" stopColor="#fff1c4" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="#06070c" />
        <ellipse cx={200} cy={1560} rx={420} ry={240} fill="url(#c6hl)" />
        <ellipse cx={880} cy={1560} rx={420} ry={240} fill="url(#c6hl)" />
        <g transform="translate(540 2480) scale(3.1)">
          <path d="M -80 -360 L 80 -360 L 120 0 L -120 0 Z" fill="#5d6270" />
          <path d="M -80 -360 L 0 -250 L 80 -360 L 64 -380 L 0 -300 L -64 -380 Z" fill="#474b57" />
          <rect x={-18} y={-400} width={36} height={30} fill="#0a0a0d" />
          <ellipse cx={0} cy={-430} rx={46} ry={56} fill="#0a0a0d" />
          <ellipse cx={0} cy={-430} rx={48} ry={58} fill="none" stroke="#fff6dc" strokeWidth={3} opacity={0.9} />
          {["M -16 -434 L -30 -420 L -30 -400", "M -16 -434 L -36 -448 L -36 -466", "M 16 -434 L 30 -420 L 30 -396", "M 16 -434 L 36 -450 L 40 -468", "M 16 -434 L 10 -456 L 10 -476"].map((d) => (
            <path key={d} d={d} fill="none" stroke="#ff6b7a" strokeWidth={2.4} />
          ))}
          {[-16, 16].map((x) => (
            <g key={x}>
              <circle cx={x} cy={-434} r={28} fill={C.red} opacity={0.4} />
              <circle cx={x} cy={-434} r={7} fill="#fff4f0" />
            </g>
          ))}
        </g>
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, transparent 50%, rgba(229,36,59,.2) 100%)" }} />

      <div style={{ position: "absolute", top: 300, width: 1080, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
        <div style={{ fontFamily: F.body, fontWeight: 800, fontSize: 44, letterSpacing: 10, color: C.ink }}>BLACKOUT</div>
        <div style={{ padding: "6px 18px", borderRadius: 10, background: C.red, fontFamily: F.body, fontWeight: 800, fontSize: 38, letterSpacing: 4, color: "#fff" }}>PART 6</div>
      </div>
      <div
        style={{
          position: "absolute", top: 400, width: 1080, textAlign: "center", fontFamily: F.display, fontSize: 200, lineHeight: 0.98,
          letterSpacing: 2, color: C.ink, WebkitTextStroke: "14px #05060b", paintOrder: "stroke", textShadow: "0 20px 60px rgba(0,0,0,.8)",
        }}
      >
        DON&apos;T
        <br />
        <span style={{ color: C.red }}>TRUST HIM</span>
      </div>
      <div style={{ position: "absolute", top: 860, width: 1080, textAlign: "center", fontFamily: F.body, fontWeight: 700, fontStyle: "italic", fontSize: 44, color: C.sub, letterSpacing: 1 }}>
        ...look at his eyes
      </div>
    </AbsoluteFill>
  );
};
