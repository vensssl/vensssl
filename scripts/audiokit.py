"""Shared helpers for the narrated motivational shorts (wall/, switch/).
A video script calls Track(...), places sfx/music, then .write(out_dir, events)."""
import json, os, re, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(5)

def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def env(n, a=0.005, d=0.2):
    t = np.arange(n)/SR; return np.minimum(1, t/a) * np.exp(-t/d)
def hz(note):
    names = {'C':-9,'C#':-8,'D':-7,'D#':-6,'E':-5,'F':-4,'F#':-3,'G':-2,'G#':-1,'A':0,'A#':1,'B':2}
    return 440 * 2 ** ((names[note[:-1]] + 12*(int(note[-1])-4)) / 12)
def noise(n): return rng.standard_normal(n)

def load(p):
    a, s = sf.read(p)
    if a.ndim > 1: a = a.mean(1)
    i = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, i[0]-int(.03*s)): i[-1]+int(.1*s)]
    n = int(len(a) * SR / s)
    return np.interp(np.linspace(0, len(a)-1, n), np.arange(len(a)), a)

# ---- instruments / effects ----
def pad(notes, dur, att=1.5, rel=1.5, bright=900):
    n = int(dur*SR); tt = np.arange(n)/SR; x = np.zeros(n)
    for k, nt in enumerate(notes):
        f = hz(nt)
        for det in (-0.12, 0.0, 0.13):
            x += np.sin(2*np.pi*f*(1+det/100)*tt + k) + .3*np.sin(2*np.pi*2*f*(1+det/100)*tt)
    x = lp(x, bright)
    return x * np.minimum(1, tt/att) * np.clip((dur-tt)/rel, 0, 1) / len(notes) / 3
def pluck(f, d=.9, g=1):
    n = int(d*SR); tt = np.arange(n)/SR
    x = np.sin(2*np.pi*f*tt) + .45*np.sin(2*np.pi*2*f*tt)*np.exp(-tt*6) + .2*np.sin(2*np.pi*3*f*tt)*np.exp(-tt*10)
    return x*env(n, .003, .35)*g
def kick():
    n = int(.4*SR); tt = np.arange(n)/SR
    return np.sin(2*np.pi*(50+90*np.exp(-tt*30))*tt)*env(n, .002, .14)
def hat():
    n = int(.06*SR); return hp(noise(n), 7000)*env(n, .0005, .015)
def clunk():
    n = int(.5*SR); tt = np.arange(n)/SR
    return lp(noise(n), 900)*env(n, .001, .03)*1.4 + np.sin(2*np.pi*70*tt)*env(n, .002, .12)*.8
def pop(f=900):
    n = int(.12*SR); tt = np.arange(n)/SR
    return np.sin(2*np.pi*(f*(1+2*np.exp(-tt*60)))*tt)*env(n, .001, .03)
def tick():
    n = int(.03*SR); return hp(noise(n), 3000)*env(n, .0003, .004)
def whoosh(d=.6, lo=500, hi=4000):
    n = int(d*SR); return bp(noise(n), lo, hi)*np.sin(np.linspace(0, np.pi, n))**2
def boom():
    n = int(2.2*SR); tt = np.arange(n)/SR
    return np.sin(2*np.pi*(45+60*np.exp(-tt*8))*tt)*env(n, .002, .7) + lp(noise(n), 400)*env(n, .001, .15)*.6
def riser(d):
    n = int(d*SR); tt = np.arange(n)/SR
    return bp(noise(n), 2000, 8000) * (tt/tt[-1])**3
def thud():
    n = int(.5*SR); tt = np.arange(n)/SR
    return np.sin(2*np.pi*(60+40*np.exp(-tt*20))*tt)*env(n, .002, .1) + lp(noise(n), 600)*env(n, .001, .03)*.7
def step():
    n = int(.12*SR); return lp(noise(n), 1500)*env(n, .002, .025)
def rain(d):
    n = int(d*SR); x = bp(noise(n), 1500, 9000) * 0.5
    drops = np.zeros(n); idx = rng.integers(0, n, int(d*35)); drops[idx] = rng.uniform(.3, 1, len(idx))
    return x + bp(drops, 2000, 6000)*4

def breath(d=0.34, g=1.0):
    """a soft, short inhale: shaped noise through two mouth-like resonances."""
    n = int(d*SR); tt = np.arange(n)/SR; x = noise(n)
    x = bp(x, 800, 1300)*0.9 + bp(x, 1600, 2600)*0.6 + bp(x, 3000, 5000)*0.15
    e = np.sin(np.pi*np.clip(tt/(d*0.78), 0, 1)/2)**2 * np.clip((d-tt)/(d*0.22), 0, 1)
    return x*e/np.abs(x*e).max() * 0.04 * g
def add_breaths(vo, clips, min_gap=0.33):
    """before every line that follows a pause, breathe in so the inhale ends just before the word."""
    if os.environ.get("BREATH", "1") != "1": return
    prev_end = 0.0
    for k, (st, a) in enumerate(clips):
        gap = st - prev_end
        if k == 0 or gap >= min_gap:
            d = min(0.36, max(0.22, gap*0.7)) if k else 0.3
            b = breath(d, 0.8 + 0.4*rng.random()); i = int((st - 0.05 - d)*SR)
            if i >= 0: vo[i:i+len(b)] += b[:len(vo)-i]
        prev_end = st + len(a)/SR

class Track:
    def __init__(self, lines='lines.tsv', offset=1.0, tail=3.4):
        rows = [l.rstrip('\n').split('\t') for l in open(lines) if l.strip()]
        self.segs, clips, t = [], [], offset
        for id_, voice, speed, pause, text in rows:
            a = load(f'assets/vo/{id_}.wav')
            self.segs.append(dict(id=id_, text=text, start=t, end=t+len(a)/SR)); clips.append((t, a))
            t += len(a)/SR + float(pause)*float(os.environ.get('PAUSE_SCALE', 1))
        self.seg = {s['id']: s for s in self.segs}
        self.vo_end = self.segs[-1]['end']; self.end = self.vo_end + tail
        self.N = int(self.end*SR)
        self.vo, self.sfx, self.bed = np.zeros(self.N), np.zeros(self.N), np.zeros(self.N)
        for st, a in clips: i = int(st*SR); self.vo[i:i+len(a)] += a
        add_breaths(self.vo, clips)
    def S(self, k): return self.seg[k]['start']
    def E(self, k): return self.seg[k]['end']
    def put(self, buf, at, x, g=1.0):
        i = int(at*SR)
        if i >= self.N or i < 0: return
        x = x[:self.N-i]; buf[i:i+len(x)] += x*g
    def write(self, out_dir, events, replace=(), ref=None):
        """ref: dict(prog=, swell=, dip=) -> replace the music with the held-chord reference bed (STYLE=ref)."""
        tt = np.arange(self.N)/SR
        duck = 0.35
        if ref is not None and os.environ.get("STYLE") == "ref":
            self.bed = ref_bed(self.N, **ref); duck = 0.2
        if ref is not None and os.environ.get("STYLE") == "soft":
            self.bed = soft_bed(self.N, **ref); duck = 0.3
        self.bed *= np.clip((self.end - tt)/1.8, 0, 1)
        vel = lp(np.abs(self.vo), 6); vel /= vel.max()+1e-9
        self.bed *= 1 - duck*np.clip(vel*3, 0, 1)
        mix = np.tanh((self.vo*1.05 + self.sfx + self.bed*0.9)*1.05)*0.89
        os.makedirs(out_dir, exist_ok=True)
        sf.write(f'{out_dir}/audio.wav', mix.astype(np.float32), SR)
        words = []
        for s in self.segs:
            text = s['text']
            for a, b in replace: text = text.replace(a, b)
            toks = text.split()
            w = np.array([len(re.sub(r'\W', '', x))+2 for x in toks], float); w /= w.sum()
            cur, dur = s['start'], s['end']-s['start']
            for tok, f in zip(toks, w):
                words.append(dict(text=tok, start=round(cur, 3), end=round(cur+f*dur, 3), line=s['id'])); cur += f*dur
        json.dump(words, open(f'{out_dir}/words.json', 'w'), indent=0)
        ev = {k: ([round(x, 3) for x in v] if isinstance(v, (list, tuple)) else round(v, 3)) for k, v in events.items()}
        json.dump(dict(lines={s['id']: [round(s['start'], 3), round(s['end'], 3)] for s in self.segs},
                       events=ev, endCardStart=round(self.vo_end + 0.2, 3), duration=round(self.end, 3)),
                  open(f'{out_dir}/timing.json', 'w'), indent=1)
        print('duration', round(self.end, 2))

# ---- "reference" bed: one held, emotional chord bed over a sub hum; no drums, never drops out ----
REF_PROG = {
    "am": [['A1','A2','E3','C4','G4','B4'], ['F1','F2','C3','A3','E4','G4'], ['C2','C3','G3','E4','B4','D5'], ['G1','G2','D3','B3','E4','A4']],
    "dm": [['D2','D3','A3','F4','C5','E5'], ['A#1','A#2','F3','D4','A4','C5'], ['F1','F2','C3','A3','E4','G4'], ['C2','C3','G3','E4','A4','D5']],
}
def _saw(f, n, det):
    tt = np.arange(n)/SR; x = np.zeros(n)
    for d in det:
        ph = (f*(1+d/100)*tt + rng.random()) % 1.0; x += 2*ph - 1
    return x/len(det)
def ref_bed(N, prog="am", chord_len=5.2, swell=None, dip=None):
    """N samples. swell: time the bed opens up (climax). dip: (t0, t1) to thin it out briefly."""
    chords = REF_PROG[prog]; tt = np.arange(N)/SR; bed = np.zeros(N); xf = 1.6
    t, k = 0.0, 0
    while t < N/SR:
        dur = chord_len + xf; n = min(int(dur*SR), N - int(t*SR))
        if n <= 0: break
        lt = np.arange(n)/SR; e = np.minimum(1, lt/xf) * np.clip((dur-lt)/xf, 0, 1)
        if t == 0: e = np.minimum(1, lt/0.25) * np.clip((dur-lt)/xf, 0, 1)
        x = np.zeros(n)
        for nt in chords[k % len(chords)]:
            f = hz(nt)
            if f < 90: x += 1.3*np.tanh(1.5*np.sin(2*np.pi*f*lt))           # sub hum, slightly driven
            else: x += 0.55*_saw(f, n, (-0.15, 0.0, 0.17)) + 0.35*np.sin(2*np.pi*f*lt)
        x = lp(x, 2600) + 0.12*hp(x, 2600)
        i = int(t*SR); bed[i:i+n] += x*e
        t += chord_len; k += 1
    # slow breathing swells, like a held string section
    bed *= 0.85 + 0.15*np.sin(2*np.pi*tt/7.3)
    if swell is not None:
        up = np.clip((tt - swell + 0.4)/0.6, 0, 1)
        bright = hp(bed, 900)
        bed = bed*(1 + 0.45*up) + bright*0.6*up
    if dip is not None:
        a, b = dip; d = np.clip(np.minimum((tt-a)/.3, (b-tt)/.6), 0, 1); bed *= 1 - 0.55*d
    bed /= np.abs(bed).max() + 1e-9
    return bed * 0.32

# ---- soft bed: felt-piano broken chords + a quiet warm pad. Nothing buzzy, sits well under the voice ----
SOFT_PROG = {
    "am": [['A2','E3','A3','C4','E4'], ['F2','C3','F3','A3','C4'], ['C3','G3','C4','E4','G4'], ['G2','D3','G3','B3','D4']],
    "dm": [['D3','A3','D4','F4','A4'], ['A#2','F3','A#3','D4','F4'], ['F2','C3','F3','A3','C4'], ['C3','G3','C4','E4','G4']],
}
def felt(f, d=2.6, g=1.0):
    n = int(d*SR); tt = np.arange(n)/SR
    x = np.sin(2*np.pi*f*tt) + .25*np.sin(2*np.pi*2*f*tt)*np.exp(-tt*3) + .08*np.sin(2*np.pi*3*f*tt)*np.exp(-tt*5)
    x *= np.minimum(1, tt/0.012) * np.exp(-tt*1.4)
    return lp(x, 1800) * g
def soft_bed(N, prog="am", bpm=72, swell=None, dip=None):
    chords = SOFT_PROG[prog]; beat = 60/bpm; bar = 4*beat
    tt = np.arange(N)/SR; bed = np.zeros(N); t = 0.0; k = 0
    def put(at, x):
        i = int(at*SR)
        if i < N: m = min(len(x), N-i); bed[i:i+m] += x[:m]
    order = [0, 2, 3, 4, 3, 2, 1, 2]
    while t < N/SR:
        c = chords[k % len(chords)]
        late = swell is not None and t >= swell - 0.1
        put(t, felt(hz(c[0]), 4.0, .9))
        for b, idx in enumerate(order):
            if late or b % 2 == 0:  # sparse before the climax, flowing after it
                put(t + b*beat/2, felt(hz(c[idx]), 2.4, .42 + (.1 if b == 0 else 0)))
        # warm pad: pure sines, very low, slow fade
        n = int((bar + 1.5)*SR); lt = np.arange(n)/SR
        pad = sum(np.sin(2*np.pi*hz(nt)*lt) for nt in c[1:4]) / 3
        put(t, lp(pad, 700) * np.minimum(1, lt/1.2) * np.clip((bar+1.5-lt)/1.5, 0, 1) * (0.28 if late else 0.18))
        t += bar; k += 1
    if dip is not None:
        a, b = dip; d = np.clip(np.minimum((tt-a)/.3, (b-tt)/.6), 0, 1); bed *= 1 - 0.7*d
    bed /= np.abs(bed).max() + 1e-9
    return bed * 0.2
