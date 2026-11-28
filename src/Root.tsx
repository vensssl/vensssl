import { Composition, Still, staticFile } from "remotion";
import { Cover4 } from "./blackout/Cover4";
import { Cover5 } from "./blackout/Cover5";
import { Cover6 } from "./blackout/Cover6";
import { Cover7 } from "./blackout/Cover7";
import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { TikTok, TikTokProps } from "./TikTok";
import { BlackoutPart2, BLACKOUT_P2_FRAMES } from "./blackout/BlackoutPart2";
import { BlackoutPart4, BLACKOUT_P4_FRAMES } from "./blackout/BlackoutPart4";
import { BlackoutPart5, BLACKOUT_P5_FRAMES } from "./blackout/BlackoutPart5";
import { BlackoutPart6, BLACKOUT_P6_FRAMES } from "./blackout/BlackoutPart6";
import { BlackoutPart7, BLACKOUT_P7_FRAMES } from "./blackout/BlackoutPart7";

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
    id="BlackoutPart4"
    component={BlackoutPart4}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={BLACKOUT_P4_FRAMES}
  />
  <Still id="Cover4" component={Cover4} width={1080} height={1920} />
  <Composition
    id="BlackoutPart5"
    component={BlackoutPart5}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={BLACKOUT_P5_FRAMES}
  />
  <Still id="Cover5" component={Cover5} width={1080} height={1920} />
  <Composition
    id="BlackoutPart6"
    component={BlackoutPart6}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={BLACKOUT_P6_FRAMES}
  />
  <Still id="Cover6" component={Cover6} width={1080} height={1920} />
  <Composition
    id="BlackoutPart7"
    component={BlackoutPart7}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={BLACKOUT_P7_FRAMES}
  />
  <Still id="Cover7" component={Cover7} width={1080} height={1920} />
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
