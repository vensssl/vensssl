import timing from "../../public/blackout-p6/timing.json";
export { C, F, FPS, clamp, ramp, ease, easeIO, lerp, useSec } from "./theme";

export const T = timing as unknown as {
  lines: Record<string, [number, number]>;
  silenceStart: number;
  endCardStart: number;
  duration: number;
};
/** start / end of a Part 6 narration line, in seconds */
export const L = (id: string) => T.lines[id][0];
export const LE = (id: string) => T.lines[id][1];
