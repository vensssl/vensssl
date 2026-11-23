import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { C, F } from "./theme";

const PAPER = {
  background: "#cfc8b8",
  backgroundImage:
    "linear-gradient(90deg, transparent 110px, rgba(229,36,59,.55) 110px 114px, transparent 114px), repeating-linear-gradient(transparent 0 118px, rgba(60,80,140,.28) 118px 121px)",
} as const;

/** Part 4 thumbnail: the page Mark didn't write. */
export const Cover4: React.FC = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(["400 10px Anton", "800 10px Montserrat", "700 10px Montserrat", "400 10px 'Reenie Beanie'"].map((f) => document.fonts.load(f))).then(() => continueRender(handle));
  }, [handle]);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 70%, #1A1F33 0%, ${C.bg} 60%)`, overflow: "hidden" }}>
      {/* the notebook page, lower half */}
      <div style={{ position: "absolute", left: 90, top: 1010, width: 900, height: 860, ...PAPER, transform: "rotate(-5deg)", boxShadow: "0 40px 120px rgba(0,0,0,.9)" }}>
        <div style={{ position: "absolute", left: 140, top: 46, fontFamily: F.pencil, fontSize: 86, color: "#1f2230", lineHeight: "121px", transform: "skewX(-12deg)" }}>
          <div>Mark.</div>
          <div style={{ whiteSpace: "nowrap" }}>You already forgot once.</div>
          <div style={{ whiteSpace: "nowrap" }}>Don't let them make</div>
          <div style={{ whiteSpace: "nowrap" }}>you forget again.</div>
          <div style={{ color: C.red, fontSize: 120, marginLeft: 240, marginTop: 10 }}>— Day 8</div>
        </div>
        <svg width={900} height={860} style={{ position: "absolute", inset: 0 }}>
          <ellipse cx={460} cy={225} rx={400} ry={78} fill="none" stroke={C.red} strokeWidth={9} transform="rotate(-2 460 225)" />
        </svg>
      </div>
      {/* darken the bottom so the page fades into the frame */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 55%, rgba(5,6,11,.75) 100%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, transparent 50%, rgba(229,36,59,.18) 100%)" }} />

      {/* series tag */}
      <div style={{ position: "absolute", top: 300, width: 1080, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
        <div style={{ fontFamily: F.body, fontWeight: 800, fontSize: 44, letterSpacing: 10, color: C.ink }}>BLACKOUT</div>
        <div style={{ padding: "6px 18px", borderRadius: 10, background: C.red, fontFamily: F.body, fontWeight: 800, fontSize: 38, letterSpacing: 4, color: "#fff" }}>PART 4</div>
      </div>

      {/* headline */}
      <div
        style={{
          position: "absolute", top: 400, width: 1080, textAlign: "center", fontFamily: F.display, fontSize: 210, lineHeight: 0.98,
          letterSpacing: 2, color: C.ink, WebkitTextStroke: "14px #05060b", paintOrder: "stroke", textShadow: "0 20px 60px rgba(0,0,0,.8)",
        }}
      >
        I DIDN'T
        <br />
        <span style={{ color: C.red }}>WRITE THIS</span>
      </div>
      <div style={{ position: "absolute", top: 880, width: 1080, textAlign: "center", fontFamily: F.body, fontWeight: 700, fontStyle: "italic", fontSize: 44, color: C.sub, letterSpacing: 1 }}>
        ...and it's warning me about myself
      </div>
    </AbsoluteFill>
  );
};
