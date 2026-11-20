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
