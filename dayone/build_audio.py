"""Day One soundtrack: narration + synthesized music bed + SFX.
Writes ../public/dayone/{audio.wav,words.json,timing.json}.  Run: python3 build_audio.py"""
import json, os, re, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000; OFFSET = 1.1; ENDCARD = 3.4
rng = np.random.default_rng(11)

def load(p):
    a, s = sf.read(p)
    if a.ndim > 1: a = a.mean(1)
    i = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, i[0]-int(.03*s)): i[-1]+int(.1*s)]
    n = int(len(a) * SR / s)
    return np.interp(np.linspace(0, len(a)-1, n), np.arange(len(a)), a)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def env(n, a=0.005, d=0.2):
    t = np.arange(n)/SR; return np.minimum(1, t/a) * np.exp(-t/d)
def hz(note):  # 'A3' style
    names = {'C':-9,'C#':-8,'D':-7,'D#':-6,'E':-5,'F':-4,'F#':-3,'G':-2,'G#':-1,'A':0,'A#':1,'B':2}
    return 440 * 2 ** ((names[note[:-1]] + 12*(int(note[-1])-4)) / 12)

rows = [l.rstrip('\n').split('\t') for l in open('lines.tsv') if l.strip()]
segs, clips, t = [], [], OFFSET
for id_, voice, speed, pause, text in rows:
    a = load(f'assets/vo/{id_}.wav')
    segs.append(dict(id=id_, text=text, start=t, end=t+len(a)/SR)); clips.append((t, a))
    t += len(a)/SR + float(pause)*float(os.environ.get('PAUSE_SCALE', 1))
seg = {s['id']: s for s in segs}
vo_end = segs[-1]['end']
end = vo_end + ENDCARD
N = int(end*SR)
vo, sfx, bed = np.zeros(N), np.zeros(N), np.zeros(N)
for st, a in clips: i = int(st*SR); vo[i:i+len(a)] += a

def put(buf, at, x, g=1.0):
    i = int(at*SR)
    if i >= N: return
    x = x[:N-i]; buf[i:i+len(x)] += x*g

# ---------- events shared with the picture (seconds) ----------
S = lambda k: seg[k]['start']; E = lambda k: seg[k]['end']
ev = dict(
    spotA=0.15, spotB=0.55,
    roll30=[S('06') - 0.05, S('06') + 0.85],       # DAY 1 -> 30
    roll100=[S('07') - 0.05, S('07') + 1.0],       # DAY 30 -> 100
    impact=E('10') + 0.05,                         # the curve explodes
    stairs=S('11') + 0.2,
)

# ---------- SFX ----------
def clunk():  # spotlight switching on
    n = int(.5*SR); tt = np.arange(n)/SR
    return lp(rng.standard_normal(n), 900)*env(n, .001, .03)*1.4 + np.sin(2*np.pi*70*tt)*env(n, .002, .12)*.8
put(sfx, ev['spotA'], clunk(), .5); put(sfx, ev['spotB'], clunk(), .5)
def pop(f=900, g=1):
    n = int(.12*SR); tt = np.arange(n)/SR
    return np.sin(2*np.pi*(f*(1+2*np.exp(-tt*60)))*tt)*env(n, .001, .03)*g
def tick(g=1):
    n = int(.03*SR); return hp(rng.standard_normal(n), 3000)*env(n, .0003, .004)*g
# chips in line 02 land on "age" / "city" / "zero dollars"
for k, f in ((0.35, 820), (1.25, 980), (2.2, 700)): put(sfx, S('02')+k, pop(f), .22)
put(sfx, S('03')+0.9, pop(1300), .12)                            # phone lights
n = int(.5*SR); put(sfx, S('04')+0.95, bp(rng.standard_normal(n), 1200, 5000)*np.sin(np.linspace(0, np.pi, n))**2, .05)  # page
for a, b, cnt in (ev['roll30'] + [14], ev['roll100'] + [18]):     # counter ticks
    for k in range(cnt): put(sfx, a + (b-a)*(k/cnt)**0.8, tick(), .35)
# riser into impact
r0 = S('09'); n = int((ev['impact']-r0)*SR); tt = np.arange(n)/SR
riser = bp(rng.standard_normal(n), 2000, 8000) * (tt/tt[-1])**3
put(sfx, r0, riser, .05)
n = int(2.2*SR); tt = np.arange(n)/SR
boom = np.sin(2*np.pi*(45+60*np.exp(-tt*8))*tt)*env(n, .002, .7) + lp(rng.standard_normal(n), 400)*env(n, .001, .15)*.6
put(sfx, ev['impact'], boom, .55)
# whooshes (two takes) for the equations
def whoosh(d, lo, hi):
    n = int(d*SR); return bp(rng.standard_normal(n), lo, hi)*np.sin(np.linspace(0, np.pi, n))**2
put(sfx, S('11')-0.25, whoosh(.6, 500, 4000), .08)
put(sfx, S('12')-0.25, whoosh(.7, 300, 2500), .08)
# downward tone as the other figure fades
n = int(2.5*SR); tt = np.arange(n)/SR
put(sfx, S('12')+3.0, np.sin(2*np.pi*np.cumsum(220*np.exp(-tt*0.9))/SR)*np.exp(-tt*1.2)*np.minimum(1, tt/.05), .05)

# ---------- music ----------
def pad(notes, dur, att=1.5, rel=1.5, bright=900):
    n = int(dur*SR); tt = np.arange(n)/SR; x = np.zeros(n)
    for k, nt in enumerate(notes):
        f = hz(nt)
        for det in (-0.12, 0.0, 0.13):
            x += np.sin(2*np.pi*f*(1+det/100)*tt + k) + .3*np.sin(2*np.pi*2*f*(1+det/100)*tt)
    x = lp(x, bright)
    e = np.minimum(1, tt/att) * np.minimum(1, (dur-tt)/rel)
    return x*e/len(notes)/3
def pluck(f, d=.9, g=1):
    n = int(d*SR); tt = np.arange(n)/SR
    x = (np.sin(2*np.pi*f*tt) + .45*np.sin(2*np.pi*2*f*tt)*np.exp(-tt*6) + .2*np.sin(2*np.pi*3*f*tt)*np.exp(-tt*10))
    return x*env(n, .003, .35)*g
def kick():
    n = int(.4*SR); tt = np.arange(n)/SR
    return np.sin(2*np.pi*(50+90*np.exp(-tt*30))*tt)*env(n, .002, .14)

# act 1: dark pad, A minor -> F, until "That's the trap"
trap = S('08')
chords = [['A2','E3','C4'], ['F2','C3','A3'], ['C3','G3','E4'], ['G2','D3','B3']]
cd = (trap - 0.0) / 4
for k, ch in enumerate(chords): put(bed, k*cd, pad(ch, cd+1.6, att=1.2 if k else 2.5, rel=1.4), .5)
# soft heartbeat pulse under the days
for b in np.arange(S('05'), trap - 0.3, 60/72): put(bed, b, kick(), .16)
# "That's the trap": near silence, one low note
put(bed, trap, pad(['A1','A2'], 2.0, att=.05, rel=1.5, bright=300), .45)
# act 2: arpeggio builds through 09-10
arp = ['A3','C4','E4','A4','E4','C4','B3','E4','G4','B4','G4','E4']
a0, a1 = S('09') - 0.1, ev['impact']
t_ = a0; k = 0
while t_ < a1 - 0.05:
    prog = (t_-a0)/(a1-a0)
    put(bed, t_, pluck(hz(arp[k % len(arp)]), .8, .2 + .35*prog))
    t_ += 0.30 - 0.14*prog; k += 1
# act 3: bright, F - C - G - Am at 96 bpm, from the impact to the end
bpm = 96; beat = 60/bpm; bar = 4*beat
prog3 = [['F2','C3','A3','C4'], ['C3','G3','E4'], ['G2','D3','B3','D4'], ['A2','E3','C4','E4']]
t_ = ev['impact']; k = 0
while t_ < end - 0.5:
    ch = prog3[k % 4]
    put(bed, t_, pad(ch, bar+1.2, att=.25, rel=1.0, bright=1600), .55)
    for b in range(8):
        f = hz(ch[(b*2) % len(ch)])*2
        put(bed, t_ + b*beat/2, pluck(f, .5, .16 if b % 2 else .24))
    if t_ < S('14'):
        for b in range(4): put(bed, t_ + b*beat, kick(), .32 if b % 2 == 0 else .2)
    t_ += bar; k += 1
# soften act 3 under line 12 (the decline) and fade out the tail
tt = np.arange(N)/SR
duck = np.ones(N)
s12, e12 = S('12'), E('12') + .3
duck *= 1 - 0.45*np.clip(np.minimum((tt-s12)/.4, (e12-tt)/.6), 0, 1)
duck *= np.clip((end - tt)/1.8, 0, 1)
bed *= duck
if os.environ.get("STYLE") == "ref":   # held-chord reference bed (see scripts/audiokit.py)
    import sys; sys.path.insert(0, '../scripts'); from audiokit import ref_bed
    bed = ref_bed(N, 'am', swell=ev['impact'], dip=(trap, S('09'))) * np.clip((end - tt)/1.8, 0, 1)
if os.environ.get("STYLE") == "soft":
    import sys; sys.path.insert(0, '../scripts'); from audiokit import soft_bed
    bed = soft_bed(N, 'am', swell=ev['impact'], dip=(trap, S('09'))) * np.clip((end - tt)/1.8, 0, 1)
# side-chain the bed under the voice
vel = lp(np.abs(vo), 6); vel /= vel.max()+1e-9
bed *= 1 - 0.35*np.clip(vel*3, 0, 1)

mix = vo*1.05 + sfx + bed*0.9
mix = np.tanh(mix*1.05)*0.89
os.makedirs('../public/dayone', exist_ok=True)
sf.write('../public/dayone/audio.wav', mix.astype(np.float32), SR)

# ---------- word timings (spread each line by characters) ----------
words = []
for s in segs:
    text = (s['text'].replace('One point zero one', '1.01').replace('Zero point nine nine', '0.99')
            .replace('three sixty five', '365').replace('thirty seven', '37').replace('Day thirty', 'Day 30')
            .replace('Day one hundred', 'Day 100').replace('One percent', '1%'))
    toks = text.split()
    w = np.array([len(re.sub(r'\W', '', x))+2 for x in toks], float); w /= w.sum()
    cur, dur = s['start'], s['end']-s['start']
    for tok, f in zip(toks, w):
        words.append(dict(text=tok, start=round(cur, 3), end=round(cur+f*dur, 3), line=s['id'])); cur += f*dur
json.dump(words, open('../public/dayone/words.json', 'w'), indent=0)
json.dump(dict(lines={s['id']: [round(s['start'], 3), round(s['end'], 3)] for s in segs},
               events={k: (v if isinstance(v, list) else round(v, 3)) for k, v in ev.items()},
               endCardStart=round(vo_end + 0.2, 3), duration=round(end, 3)),
          open('../public/dayone/timing.json', 'w'), indent=1)
print('duration', round(end, 2))
