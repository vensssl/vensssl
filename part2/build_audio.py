"""Builds the Part 2 soundtrack: narration (offset), synthesized SFX and drone.
Writes ../public/blackout-p2/{audio.wav,words.json,timing.json}."""
import json, re, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
SR = 48000; OFFSET = 1.8; SILENCE = 1.5; ENDCARD = 3.2
rng = np.random.default_rng(7)

def load(p):
    a, s = sf.read(p)
    if a.ndim > 1: a = a.mean(1)
    i = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, i[0]-int(.03*s)): i[-1]+int(.08*s)]
    n = int(len(a) * SR / s)
    return np.interp(np.linspace(0, len(a)-1, n), np.arange(len(a)), a)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def env(n, a=0.005, d=0.2):
    t = np.arange(n)/SR; return np.minimum(1, t/a) * np.exp(-t/d)
def brown(n): return np.cumsum(rng.standard_normal(n)) * 0.02

rows = [l.rstrip('\n').split('\t') for l in open('lines.tsv')]
segs, t = [], OFFSET
clips = []
for id_, voice, speed, pause, text in rows:
    a = load(f'assets/vo-lines/{id_}.wav')
    segs.append(dict(id=id_, voice=voice, text=text, start=t, end=t+len(a)/SR))
    clips.append((t, a)); t += len(a)/SR + float(pause)
vo_end = segs[-1]['end']
silence_start = vo_end + 0.15
end = silence_start + SILENCE + ENDCARD
N = int(end * SR)
vo = np.zeros(N); sfx = np.zeros(N); bed = np.zeros(N)
for st, a in clips: i = int(st*SR); vo[i:i+len(a)] += a

def put(buf, at, x, g=1.0):
    i = int(at*SR); x = x[:max(0, N-i)]; buf[i:i+len(x)] += x*g
def seg(id_): return next(s for s in segs if s['id'] == id_)

# --- SFX ---
def knock():
    n = int(.35*SR); tt = np.arange(n)/SR
    body = (np.sin(2*np.pi*95*tt) + .6*np.sin(2*np.pi*190*tt)) * env(n, .002, .07)
    click = lp(rng.standard_normal(n), 2500) * env(n, .001, .012)
    return body*.9 + click*.8
for k in (0.15, 0.8, 1.45): put(sfx, k, knock(), .9)
def thump(g=.8):
    n = int(.4*SR); tt = np.arange(n)/SR
    return np.sin(2*np.pi*55*tt) * env(n, .004, .09) * g
s7 = seg('07'); put(sfx, s7['start'], thump()); put(sfx, s7['start']+.28, thump(.6))
put(sfx, s7['start']+1.0, thump()); put(sfx, s7['start']+1.28, thump(.6))
# paper slide
n = int(1.1*SR); x = bp(rng.standard_normal(n), 1500, 6000) * np.sin(np.linspace(0, np.pi, n))**2
put(sfx, seg('08')['end']-0.6, x, .12)
# radio static under the address line, and click + static under the broadcast
def static(d, g): n = int(d*SR); return bp(rng.standard_normal(n), 800, 5000) * g * (0.7+0.3*np.sin(np.linspace(0, 40, n)))
put(sfx, seg('04')['start']+0.6, static(2.6, .035))
n = int(.05*SR); put(sfx, seg('20')['start']+2.2, hp(rng.standard_normal(n), 1000)*env(n, .0005, .008), .6)
s22 = seg('22'); put(sfx, seg('20')['start']+2.25, static(s22['end']-seg('20')['start']-1.8, .04))
# door creak at sunrise
n = int(1.4*SR); tt = np.arange(n)/SR; f = 180 + 120*tt/1.4
x = np.sin(2*np.pi*np.cumsum(f)/SR) * (0.5+0.5*np.sign(np.sin(2*np.pi*22*tt))) * np.sin(np.linspace(0, np.pi, n))
put(sfx, seg('12')['end']-0.5, bp(x, 200, 2500), .07)
# engines: rumble from "Engines" until the silence
e0 = seg('31')['start'] + 0.9; n = int((silence_start - e0)*SR); tt = np.arange(n)/SR
rumble = lp(brown(n), 160, 4); rumble /= np.abs(rumble).max()+1e-9
rumble += 0.5*np.sin(2*np.pi*(38+3*np.sin(2*np.pi*.3*tt))*tt)
rumble *= np.minimum(1, tt/3.5) * 0.22
put(sfx, e0, rumble)
# truck door slam
n = int(.6*SR); tt = np.arange(n)/SR
put(sfx, seg('36')['start']-0.25, (np.sin(2*np.pi*70*tt)*env(n, .002, .12) + lp(rng.standard_normal(n), 1800)*env(n, .001, .03)), .55)

# --- drone bed: low, uneasy, cut dead at the silence ---
n = int(silence_start*SR); tt = np.arange(n)/SR
d = (np.sin(2*np.pi*55*tt) + .5*np.sin(2*np.pi*58.3*tt) + .25*np.sin(2*np.pi*110.5*tt)) * (0.75+0.25*np.sin(2*np.pi*.07*tt))
d += lp(brown(n), 300) * 2
d = d/np.abs(d).max() * np.minimum(1, tt/4)
put(bed, 0, d, .09)
# end card sting
n = int(2.5*SR); tt = np.arange(n)/SR
put(sfx, silence_start + SILENCE, (np.sin(2*np.pi*55*tt)+.4*np.sin(2*np.pi*82.4*tt))*env(n, .01, .9), .35)

mix = vo*1.0 + sfx + bed
mix[int(silence_start*SR):int((silence_start+SILENCE)*SR)] = 0  # true silence
mix = np.tanh(mix*1.1) * 0.9
import os; os.makedirs('../public/blackout-p2', exist_ok=True)
sf.write('../public/blackout-p2/audio.wav', mix.astype(np.float32), SR)

# word timings: spread each line's time across its words by character count
words = []
for s in segs:
    toks = s['text'].replace('Six A', '6A').replace('six P M', '6 PM').replace('Five P M', '5 PM').split()
    w = np.array([len(re.sub(r'\W', '', x))+1.5 for x in toks]); w = w/w.sum()
    cur = s['start']; dur = s['end']-s['start']
    for tok, f in zip(toks, w):
        words.append(dict(text=tok, start=round(cur, 3), end=round(cur+f*dur, 3), line=s['id'], voice=s['voice'])); cur += f*dur
json.dump(words, open('../public/blackout-p2/words.json', 'w'), indent=0)
json.dump(dict(lines={s['id']: [round(s['start'], 3), round(s['end'], 3)] for s in segs},
               silenceStart=round(silence_start, 3), endCardStart=round(silence_start+SILENCE, 3), duration=round(end, 3)),
          open('../public/blackout-p2/timing.json', 'w'), indent=1)
print('duration', round(end, 2), 'silence at', round(silence_start, 2))
