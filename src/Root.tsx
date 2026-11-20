import { Composition, staticFile } from "remotion";
import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { TikTok, TikTokProps } from "./TikTok";
import { BlackoutPart2, BLACKOUT_P2_FRAMES } from "./blackout/BlackoutPart2";

const FPS = 30;

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="BlackoutPart2"
    component={BlackoutPart2}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={BLACKOUT_P2_FRAMES}
  />
  <Composition
    id="TikTok"
    component={TikTok}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={FPS * 10}
    defaultProps={{ video: "clip.mp4", captions: "clip.json" } satisfies TikTokProps}
    // Match the composition length to the clip's length.
    calculateMetadata={async ({ props }) => {
      const input = new Input({
        formats: ALL_FORMATS,
        source: new UrlSource(staticFile(props.video)),
      });
      const seconds = await input.computeDuration();
      return { durationInFrames: Math.ceil(seconds * FPS) };
    }}
  />
  </>
);
