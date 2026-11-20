import { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Caption, createTikTokStyleCaptions, TikTokPage } from "@remotion/captions";

export type TikTokProps = {
  /** File in public/ */
  video: string;
  /** Caption[] JSON in public/ (made by `npm run transcribe`) */
  captions: string;
};

// How many ms of speech share one on-screen "page". Lower = fewer words at once.
const COMBINE_MS = 1200;

export const TikTok: React.FC<TikTokProps> = ({ video, captions }) => {
  const { fps } = useVideoConfig();
  const [data, setData] = useState<Caption[] | null>(null);
  const [handle] = useState(() => delayRender("Loading captions"));

  useEffect(() => {
    fetch(staticFile(captions))
      .then((r) => r.json())
      .then((json: Caption[]) => {
        setData(json);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [captions, handle]);

  const pages = useMemo(
    () =>
      data
        ? createTikTokStyleCaptions({ captions: data, combineTokensWithinMilliseconds: COMBINE_MS }).pages
        : [],
    [data],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* objectFit: cover center-crops a landscape clip to fill 9:16 */}
      <OffthreadVideo src={staticFile(video)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {pages.map((page, i) => {
        const next = pages[i + 1];
        const from = Math.round((page.startMs / 1000) * fps);
        const endMs = next ? Math.min(next.startMs, page.startMs + page.durationMs + 500) : page.startMs + page.durationMs + 500;
        const duration = Math.max(1, Math.round((endMs / 1000) * fps) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={duration} layout="none">
            <CaptionPage page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const CaptionPage: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = page.startMs + (frame / fps) * 1000;

  return (
    // Sits above TikTok's bottom UI (caption/handle/buttons) and left of the action rail.
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 700, paddingLeft: 120, paddingRight: 190 }}>
      <div
        style={{
          fontFamily: "Inter, Arial Black, sans-serif",
          fontWeight: 900,
          fontSize: 84,
          lineHeight: 1.1,
          textAlign: "center",
          textTransform: "uppercase",
          color: "white",
          WebkitTextStroke: "14px black",
          paintOrder: "stroke",
          whiteSpace: "pre-wrap",
        }}
      >
        {page.tokens.map((t) => {
          const active = t.fromMs <= nowMs && nowMs < t.toMs;
          return (
            <span key={t.fromMs} style={{ color: active ? "#FFE600" : "white" }}>
              {t.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
