"""Narration voice: Kokoro (local) with voice blending + a "cinematic narrator" chain.
Usage (from a video folder):  python3 ../scripts/voice.py PRESET            -> assets/vo/<id>.wav for lines.tsv
                              python3 ../scripts/voice.py PRESET --say "..." out.wav
Presets live in PRESETS below; lines.tsv's voice/speed columns are ignored in favour of the preset."""
import os, subprocess, sys, tempfile
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

CACHE = os.path.expanduser("~/.cache/hyperframes/tts")
PRESETS = {
    # blend: [(voice, weight)], speed, pitch in semitones (formant-preserving), extra low warmth (dB)
    "deep":    dict(blend=[("am_michael", .6), ("am_fenrir", .4)], speed=.9, pitch=-1.6, warmth=4.0, lang="en-us"),
    "british": dict(blend=[("bm_george", .75), ("bm_fable", .25)], speed=.9, pitch=-1.2, warmth=3.5, lang="en-gb"),
    "smooth":  dict(blend=[("am_michael", .5), ("am_puck", .2), ("am_onyx", .3)], speed=.9, pitch=-0.8, warmth=3.0, lang="en-us"),
    "female":  dict(blend=[("af_heart", .7), ("af_bella", .3)], speed=.92, pitch=-0.6, warmth=2.0, lang="en-us"),
}

_k = None
def kokoro():
    global _k
    if _k is None: _k = Kokoro(f"{CACHE}/models/kokoro-v1.0.onnx", f"{CACHE}/voices/voices-v1.0.bin")
    return _k

def chain(p):
    """ffmpeg filter: pitch down (formants kept), clean low end, warm body, cut mud, presence, de-ess,
    two-stage compression, a small dark room, and a limiter."""
    return ",".join([
        f"rubberband=pitch={2 ** (p['pitch'] / 12):.4f}:formant=preserved:transients=smooth",
        "highpass=f=65",
        f"equalizer=f=120:t=q:w=0.9:g={p['warmth']}",
        "equalizer=f=320:t=q:w=1.2:g=-3",
        "equalizer=f=3200:t=q:w=1.0:g=2.5",
        "equalizer=f=11000:t=q:w=0.8:g=1.5",
        "deesser=i=0.35:f=0.55",
        "acompressor=threshold=-22dB:ratio=3:attack=8:release=120:makeup=4",
        "acompressor=threshold=-10dB:ratio=6:attack=2:release=60",
        "aecho=0.85:0.5:38|61:0.11|0.07",
        "volume=7.5dB",
        "alimiter=limit=0.89",
    ])

def say(text, preset, out):
    p = PRESETS[preset]
    k = kokoro()
    style = sum(k.get_voice_style(v) * w for v, w in p["blend"])
    audio, sr = k.create(text, voice=style, speed=p["speed"], lang=p["lang"])
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f: raw = f.name
    sf.write(raw, audio, sr)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", chain(p), "-ar", "48000", out], check=True)
    os.unlink(raw)

if __name__ == "__main__":
    preset = sys.argv[1]
    if len(sys.argv) > 2 and sys.argv[2] == "--say":
        say(sys.argv[3], preset, sys.argv[4]); sys.exit()
    os.makedirs("assets/vo", exist_ok=True)
    for line in open("lines.tsv"):
        if not line.strip(): continue
        id_, _v, _s, _p, text = line.rstrip("\n").split("\t")
        say(text, preset, f"assets/vo/{id_}.wav"); print(id_, end=" ", flush=True)
    print()
