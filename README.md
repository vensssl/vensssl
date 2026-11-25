# Clip → vertical TikTok with burned-in subtitles

Remotion project (`src/`) plus the HyperFrames agent skills (`.agents/skills`, linked into `.claude/skills`).

```bash
npm install
cp ~/Videos/my-clip.mp4 public/clip.mp4
npm run transcribe -- public/clip.mp4          # -> public/clip.json (word timings)
npm run studio                                 # preview + tweak at localhost:3000
npm run render -- TikTok out/tiktok.mp4        # 1080x1920 MP4 with captions burned in
```

Another file name: `npm run render -- TikTok out/x.mp4 --props='{"video":"x.mp4","captions":"x.json"}'`.
Non-English: `npm run transcribe -- public/clip.mp4 medium de`.

## BLACKOUT Part 2

```bash
cd part2 && python3 build_audio.py   # narration lines -> soundtrack + word timings
```
```bash
npm run render -- BlackoutPart2 out/blackout-part2.mp4
```

Narration lines and voices: `part2/lines.tsv` (regenerate one with `npx hyperframes tts`). Scenes: `src/blackout/`.

## Motivational shorts (Day One, The Wall, The Switch)

Narrated 9:16 shorts in a dark-stage / spotlight / neon-icon style. Each has a script (`lines.tsv`) and a soundtrack builder:

```bash
pip install kokoro-onnx soundfile scipy numpy
export STYLE=soft PAUSE_SCALE=1                 # soft piano bed (STYLE=ref: held-chord drone, PAUSE_SCALE=0.65)
cd dayone && python3 ../scripts/voice.py human-f && python3 build_audio.py   # also wall/, switch/; voice presets in scripts/voice.py
npx remotion render DayOne out/01-day-one.mp4      # TheWall, TheSwitch
```

Scenes: `src/dayone/` (shared drawing kit in `kit.tsx`), `src/shorts/`.
