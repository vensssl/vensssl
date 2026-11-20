// Usage: npm run transcribe -- public/clip.mp4 [model] [language]
// Writes public/clip.json (Caption[]) next to the clip, for the TikTok composition.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
} from "@remotion/install-whisper-cpp";

const [input, model = "medium.en", language = "en"] = process.argv.slice(2);
if (!input) {
  console.error("Usage: npm run transcribe -- public/clip.mp4 [model] [language]");
  process.exit(1);
}

const whisperPath = path.resolve(".whisper");
const whisperCppVersion = "1.7.6";
await installWhisperCpp({ to: whisperPath, version: whisperCppVersion });
await downloadWhisperModel({ model, folder: whisperPath });

// whisper.cpp wants 16 kHz mono WAV.
mkdirSync(".tmp", { recursive: true });
const wav = path.resolve(".tmp", "audio.wav");
execFileSync("ffmpeg", ["-y", "-i", input, "-ar", "16000", "-ac", "1", wav], { stdio: "inherit" });

const json = await transcribe({
  inputPath: wav,
  whisperPath,
  whisperCppVersion,
  model,
  language,
  tokenLevelTimestamps: true,
  printOutput: false,
  onProgress: (p) => process.stdout.write(`\rTranscribing ${Math.round(p * 100)}%`),
});
const { captions } = toCaptions({ whisperCppOutput: json });

const out = input.replace(/\.[^.]+$/, ".json");
writeFileSync(out, JSON.stringify(captions, null, 2));
rmSync(".tmp", { recursive: true, force: true });
console.log(`\nWrote ${captions.length} words to ${out} — fix any misheard words there before rendering.`);
