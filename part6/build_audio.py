"""Builds the Part 6 soundtrack: narration, synthesized SFX and drone.
Writes ../public/blackout-p6/{audio.wav,words.json,timing.json}."""
import json, os, re, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
SR = 48000; OFFSET = 0.25; SILENCE = 1.3; ENDCARD = 3.8
rng = np.random.default_rng(6)

def load(p):
    a, s = sf.read(p)
    if a.ndim > 1: a = a.mean(1)
    i = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, i[0]-int(.03*s)): i[-1]+int(.08*s)]
    n = int(len(a) * SR / s)
    return np.interp(np.linspace(0, len(a)-1, n), np.arange(len(a)), a)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def env(n, a=0.005, d=0.2):
    t = np.arange(n)/SR; return np.minimum(1, t/a) * np.exp(-t/d)
def brown(n): return np.cumsum(rng.standard_normal(n)) * 0.02
def echo(x, taps):  # simple multi-tap reverb tail
    out = np.concatenate([x, np.zeros(int(max(d for d, _ in taps)*SR))])
    for d, g in taps: i = int(d*SR); out[i:i+len(x)] += x*g
    return out

rows = [l.rstrip('\n').split('\t') for l in open('lines.tsv')]
segs, clips, t = [], [], OFFSET
for id_, voice, speed, pause, text in rows:
    a = load(f'assets/vo-lines/{id_}.wav')
    n = len(a)
    if voice == 'bm_george':  # in person now, out on the open street: a slap off the buildings
        a = echo(a, [(.11, .16), (.24, .08)])
    elif voice == 'bf_emma':  # her note, read in her voice: close, breathy, a little ghostly
        a = echo(hp(a, 160) * 0.95, [(.05, .22), (.13, .14), (.26, .07)])
    segs.append(dict(id=id_, voice=voice, text=text, start=t, end=t+n/SR))
    clips.append((t, a)); t += n/SR + float(pause)
vo_end = segs[-1]['end']
silence_start = vo_end + 0.9
end = silence_start + SILENCE + ENDCARD
N = int(end * SR)
vo = np.zeros(N); sfx = np.zeros(N); bed = np.zeros(N)
for st, a in clips: i = int(st*SR); a = a[:N-i]; vo[i:i+len(a)] += a
def put(buf, at, x, g=1.0):
    i = int(at*SR)
    if i >= N: return
    x = x[:N-i]; buf[i:i+len(x)] += x*g
def seg(id_): return next(s for s in segs if s['id'] == id_)
def L(id_): return seg(id_)['start']
def LE(id_): return seg(id_)['end']

def tone(f, d, g, a=.004, dec=.12):
    n = int(d*SR); tt = np.arange(n)/SR; return np.sin(2*np.pi*f*tt) * env(n, a, dec) * g
def clank(f=420, g=.5):
    n = int(.5*SR); tt = np.arange(n)/SR
    x = sum(np.sin(2*np.pi*f*k*tt)*w for k, w in ((1, 1), (2.76, .5), (5.4, .25))) * env(n, .001, .09)
    return (x + lp(rng.standard_normal(n), 3000)*env(n, .0005, .01)) * g
def relay(g=.6):  # a city block switching off: low thunk + electrical snap
    n = int(.9*SR); tt = np.arange(n)/SR
    return (np.sin(2*np.pi*42*tt)*env(n, .002, .25) + bp(rng.standard_normal(n), 2000, 7000)*env(n, .0005, .015)*.7) * g
def whoosh(d=.45, g=.15):
    n = int(d*SR); return bp(rng.standard_normal(n), 400, 4000) * np.sin(np.linspace(0, np.pi, n))**3 * g
def thump(g=.8):
    n = int(.4*SR); tt = np.arange(n)/SR; return np.sin(2*np.pi*55*tt)*env(n, .004, .09)*g
def hit(d=2.2, f=46, g=.5):
    n = int(d*SR); tt = np.arange(n)/SR
    return ((np.sin(2*np.pi*f*tt)+.5*np.sin(2*np.pi*f*1.5*tt))*env(n, .003, d*.35) + lp(rng.standard_normal(n), 900)*env(n, .001, .08)) * g
def pencil(d, g=.06):  # graphite on paper: bursts of filtered noise, one per stroke
    n = int(d*SR); x = bp(rng.standard_normal(n), 2500, 7000)
    tt = np.arange(n)/SR; strokes = (np.sin(2*np.pi*7.5*tt + rng.random()*6) > -0.2).astype(float)
    return x * lp(strokes, 40) * np.minimum(1, tt/.02) * np.minimum(1, (n/SR-tt)/.05) * g
def page(g=.18):
    n = int(.5*SR); return bp(rng.standard_normal(n), 800, 6000) * np.sin(np.linspace(0, np.pi, n))**2 * g
def crackle(d, g=.2):  # arcing electricity
    n = int(d*SR); x = np.zeros(n)
    for _ in range(int(d*40)):
        i = rng.integers(0, n-2000); m = int(rng.integers(200, 1600))
        x[i:i+m] += bp(rng.standard_normal(m), 1500, 9000) * env(m, .0002, .004) * rng.random()
    return x * g
def heartbeats(t0, t1, gap, g=.5):
    for kk in np.arange(0, t1-t0, gap): put(sfx, t0+kk, thump(g)); put(sfx, t0+kk+gap*.32, thump(g*.66))
def engines(t0, t1, g):  # trucks idling: low lumpy diesel rumble
    n = int((t1-t0)*SR); tt = np.arange(n)/SR
    x = lp(rng.standard_normal(n), 90, 4) * 6 * (0.7 + 0.3*np.sign(np.sin(2*np.pi*13*tt)))
    x += 0.4*np.sin(2*np.pi*31*tt)
    x *= np.minimum(1, tt/.6) * np.minimum(1, (n/SR-tt)/.6)
    put(sfx, t0, lp(x, 200), g)

# HOOK: pencil scratches out names on "every name on my list", hard hit on "not one of them came back"
for k in range(4): put(sfx, L('01') + 0.15 + k*0.55, pencil(.35, .08))
put(sfx, L('02') - 0.05, hit(2.4, 44, .55))
# recap: the city switching off, then the ladder
put(sfx, L('04') + 0.9, relay(.5)); put(sfx, L('04') + 1.4, relay(.7))
for kk in range(6): put(sfx, L('05') + 0.3 + kk*0.32, clank(380+rng.random()*60, .2))
# the street: trucks idling from line 06 through the badge
engines(L('06') - 0.3, L('11') - 0.1, .5)
put(sfx, L('08') + 0.5, tone(2600, .05, .1, a=.0004, dec=.01))  # badge clip
# "I remembered": whoosh + a thin ringing that fades into the control room
put(sfx, L('10') + 1.1, whoosh(.8, .22))
n = int(3.5*SR); tt = np.arange(n)/SR
put(sfx, L('10') + 1.2, np.sin(2*np.pi*3150*tt) * env(n, .2, 1.1) * .04)
# control room: alarm two-tone, mains hum, arcing as it moves house to house
c0, c1 = L('11') - 0.2, L('17')
for kk in np.arange(0.3, L('13') - c0, 0.9):
    put(sfx, c0 + kk, tone(880, .32, .06, a=.01, dec=.3)); put(sfx, c0 + kk + .4, tone(660, .32, .06, a=.01, dec=.3))
n = int((c1-c0)*SR); tt = np.arange(n)/SR
hum = (np.sin(2*np.pi*60*tt) + .5*np.sin(2*np.pi*120*tt) + .25*np.sin(2*np.pi*180*tt)) * np.minimum(1, tt/.4) * np.minimum(1, (n/SR-tt)/.2)
put(sfx, c0, hum, .05)
put(sfx, L('13'), crackle(LE('14') - L('13') + 0.3, .3))
# "stopped being people": a breath-in reversed swell, then the hit
n = int(1.2*SR); sw = bp(rng.standard_normal(n), 300, 3000) * np.linspace(0, 1, n)**3
put(sfx, L('16') - 1.2, sw, .18); put(sfx, L('16') + 0.05, hit(2.2, 41, .5))
# breakers dropping block by block, faster and faster, then everything off on "to starve it"
b0, b1 = L('17') + 0.9, L('18')
tcur = b0
while tcur < b1:
    frac = (tcur - b0) / max(.01, b1 - b0); put(sfx, tcur, relay(.35 + .4*frac)); tcur += .5 - .3*frac
put(sfx, L('18') - 0.05, relay(1.0)); put(sfx, L('18') - 0.05, thump(.9))
# writing the list
put(sfx, L('19') + 0.6, pencil(LE('21') - L('19') - 0.4, .05))
# back on the street: engines again, his voice close, heartbeat under the question
engines(L('22') - 0.3, L('25') + 0.4, .45)
heartbeats(L('24'), LE('24') + 0.6, 0.85, .4)
# the notebook: page turn, a new line being written by itself
put(sfx, L('25') + 0.5, page()); put(sfx, L('25') + 0.8, page(.12))
put(sfx, L('26') + 0.2, pencil(LE('27') - L('26'), .06))
# look up: heartbeat fast, then electricity surges up into his eyes
heartbeats(L('28'), LE('29') + 0.2, 0.55, .5)
s29 = seg('29'); n = int((s29['end'] - s29['start'] + 0.8)*SR); tt = np.arange(n)/SR
f = 60 + 180*np.linspace(0, 1, n)**2
surge = np.sin(2*np.pi*np.cumsum(f)/SR) * np.linspace(0, 1, n)**2
put(sfx, s29['start'] - 0.2, surge, .12); put(sfx, s29['start'] + 0.6, crackle(1.2, .25))
put(sfx, s29['end'] - 0.15, hit(2.8, 39, .55))

# drone bed, dropping out under the control-room memory (a different, colder tone), cut dead at the silence
n = int(silence_start*SR); tt = np.arange(n)/SR
d = (np.sin(2*np.pi*55*tt) + .5*np.sin(2*np.pi*58.3*tt) + .25*np.sin(2*np.pi*110.5*tt)) * (0.75+0.25*np.sin(2*np.pi*.07*tt))
d += lp(brown(n), 300) * 2
d = d/np.abs(d).max() * np.minimum(1, tt/1.2)
d = lp(d, 180) * 1.6
a0, a1 = int(c0*SR), int(LE('21')*SR)
d[a0:a1] = hp(d[a0:a1], 90) * 0.55
d[int(L('18')*SR):int((L('18')+1.0)*SR)] *= np.linspace(0, 1, int(1.0*SR))  # "to starve it": the bed dies and returns
put(bed, 0, d, .09)
# end card sting
n = int(2.5*SR); tt = np.arange(n)/SR
put(sfx, silence_start + SILENCE, (np.sin(2*np.pi*55*tt)+.4*np.sin(2*np.pi*82.4*tt))*env(n, .01, .9), .35)

mix = vo + sfx + bed
mix[int(silence_start*SR):int((silence_start+SILENCE)*SR)] = 0
mix = np.tanh(mix*1.1) * 0.9
os.makedirs('../public/blackout-p6', exist_ok=True)
sf.write('../public/blackout-p6/audio.wav', mix.astype(np.float32), SR)

words = []
for s in segs:
    toks = s['text'].split()
    w = np.array([len(re.sub(r'\W', '', x))+1.5 for x in toks]); w = w/w.sum()
    cur = s['start']; dur = s['end']-s['start']
    for tok, f in zip(toks, w):
        words.append(dict(text=tok, start=round(cur, 3), end=round(cur+f*dur, 3), line=s['id'], voice=s['voice'])); cur += f*dur
json.dump(words, open('../public/blackout-p6/words.json', 'w'), indent=0)
json.dump(dict(lines={s['id']: [round(s['start'], 3), round(s['end'], 3)] for s in segs},
               silenceStart=round(silence_start, 3), endCardStart=round(silence_start+SILENCE, 3), duration=round(end, 3)),
          open('../public/blackout-p6/timing.json', 'w'), indent=1)
print('duration', round(end, 2), 'silence at', round(silence_start, 2))
