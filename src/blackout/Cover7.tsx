import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { C, F } from "./theme";

/** Part 7 (finale) thumbnail: a hand on the main breaker, current burning up the arm, Wrigley lit behind. */
export const Cover7: React.FC = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(["400 10px Anton", "800 10px Montserrat", "700 10px Montserrat"].map((f) => document.fonts.load(f))).then(() => continueRender(handle));
  }, [handle]);
  const bolts = [
    "M 520 1300 L 470 1420 L 520 1500 L 440 1640 L 480 1760 L 400 1920",
    "M 560 1300 L 620 1440 L 560 1560 L 650 1700 L 600 1920",
    "M 540 1300 L 520 1460 L 590 1580 L 520 1740 L 560 1920",
  ];
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <rect width={1080} height={1920} fill="#07080c" />
        <ellipse cx={540} cy={1500} rx={600} ry={500} fill="#ffe9a8" opacity={0.12} />
        <rect x={240} y={1060} width={600} height={900} rx={30} fill="#1a1d25" />
        <rect x={500} y={1120} width={80} height={800} rx={20} fill="#0d0f14" />
        <rect x={350} y={1260} width={380} height={80} rx={20} fill="#c9ccd1" />
        <path d="M 420 1240 Q 540 1210 660 1240 L 670 1360 Q 540 1390 410 1360 Z" fill="#3a3530" />
        <path d="M 420 1360 L 280 1920 L 600 1920 L 670 1360 Z" fill="#3a3530" />
        {bolts.map((d, i) => <path key={i} d={d} fill="none" stroke={i % 2 ? "#ffe9a8" : "#f4f6ff"} strokeWidth={8} />)}
        {bolts.map((d, i) => <path key={`g${i}`} d={d} fill="none" stroke="#ffe9a8" strokeWidth={30} opacity={0.15} />)}
      </svg>
      <div style={{ position: "absolute", top: 300, width: 1080, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
        <div style={{ fontFamily: F.body, fontWeight: 800, fontSize: 44, letterSpacing: 10, color: C.ink }}>BLACKOUT</div>
        <div style={{ padding: "6px 18px", borderRadius: 10, background: C.red, fontFamily: F.body, fontWeight: 800, fontSize: 38, letterSpacing: 4, color: "#fff" }}>FINAL PART</div>
      </div>
      <div style={{ position: "absolute", top: 400, width: 1080, textAlign: "center", fontFamily: F.display, fontSize: 190, lineHeight: 0.98, letterSpacing: 2, color: C.ink, WebkitTextStroke: "14px #05060b", paintOrder: "stroke", textShadow: "0 20px 60px rgba(0,0,0,.8)" }}>
        I TURNED
        <br />
        IT <span style={{ color: C.red }}>BACK ON</span>
      </div>
      <div style={{ position: "absolute", top: 830, width: 1080, textAlign: "center", fontFamily: F.body, fontWeight: 700, fontStyle: "italic", fontSize: 44, color: C.sub }}>...and I didn&apos;t let go</div>
    </AbsoluteFill>
  );
};
