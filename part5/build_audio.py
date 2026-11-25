"""Builds the Part 5 soundtrack: narration, synthesized SFX and drone.
Writes ../public/blackout-p5/{audio.wav,words.json,timing.json}."""
import json, os, re, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
SR = 48000; OFFSET = 0.35; SILENCE = 1.3; ENDCARD = 3.6
rng = np.random.default_rng(5)

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
    if id_ == '11':   # Mark's own voice inside the phone video: small speaker, wind
        a = np.tanh(bp(a, 450, 3800) * 2.2) * 0.6
    elif id_ == '27':  # calling down the shaft from street level
        a = echo(bp(a, 200, 4500) * 1.2, [(.09, .4), (.2, .28), (.34, .16), (.5, .08)])
    elif voice == 'bf_emma':  # the tunnel: a little room
        a = echo(a, [(.07, .18), (.16, .1)])
    segs.append(dict(id=id_, voice=voice, text=text, start=t, end=t+n/SR))
    clips.append((t, a)); t += n/SR + float(pause)
vo_end = segs[-1]['end']
silence_start = vo_end + 0.9
end = silence_start + SILENCE + ENDCARD
N = int(end * SR)
vo = np.zeros(N); sfx = np.zeros(N); bed = np.zeros(N)
for st, a in clips: i = int(st*SR); a = a[:N-i]; vo[i:i+len(a)] += a
def put(buf, at, x, g=1.0):
    i = int(at*SR); x = x[:max(0, N-i)]; buf[i:i+len(x)] += x*g
def seg(id_): return next(s for s in segs if s['id'] == id_)

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

# hook: phone vibrates dead, then the charging chime on "she plugged it in"
for k in range(2): put(sfx, 0.15 + k*0.35, lp(rng.standard_normal(int(.22*SR)), 180, 4) * 3, .35)
s2 = seg('02'); put(sfx, s2['end'] + 0.05, tone(1318, .5, .12, dec=.2)); put(sfx, s2['end'] + 0.17, tone(1760, .6, .1, dec=.25))
# play tap
put(sfx, seg('03')['end'] + 0.05, tone(2400, .06, .12, a=.0005, dec=.01))

# phone video, lines 08 -> 20: rooftop wind through a small mic
v0 = seg('08')['start'] - 0.25; v1 = seg('20')['end'] + 0.3
n = int((v1-v0)*SR); tt = np.arange(n)/SR
wind = bp(rng.standard_normal(n), 120, 1200) * (0.55 + 0.45*np.sin(2*np.pi*.23*tt)*np.sin(2*np.pi*.11*tt+1))
wind *= np.minimum(1, tt/0.3) * np.minimum(1, (n/SR - tt)/0.2)
put(sfx, v0, wind, .07)
put(sfx, v0, tone(1000, .12, .08, a=.001, dec=.05))  # record beep

# blackout wave: relays switching off block by block, closer and closer, between 12 and 15
w0 = seg('12')['start'] + 0.9; w1 = seg('15')['start'] + 0.15
k = 0; tcur = w0
while tcur < w1:
    frac = (tcur - w0) / (w1 - w0)
    put(sfx, tcur, lp(relay(), 300 + 6000*frac**2), 0.15 + 0.5*frac**2)
    tcur += 0.62 - 0.4*frac; k += 1
put(sfx, w1, relay(1.0)); put(sfx, w1, thump(.9))
# camera flips around
put(sfx, seg('16')['start'] + 1.4, whoosh(.4, .14))
# heartbeat from "one of them is her" through "is me"
h0 = seg('18')['start']; h1 = seg('20')['start']
for kk in np.arange(0, h1-h0, 0.75): put(sfx, h0+kk, thump(.5)); put(sfx, h0+kk+.24, thump(.34))
# "is me." — hit and the video cuts out
s20 = seg('20'); n = int(2.0*SR); tt = np.arange(n)/SR
put(sfx, s20['start']-0.05, (np.sin(2*np.pi*48*tt)+.5*np.sin(2*np.pi*72*tt))*env(n, .003, .7) + lp(rng.standard_normal(n), 900)*env(n, .001, .08), .5)
# "You wrote it." — low swell under it
s23 = seg('23'); n = int(2.4*SR); tt = np.arange(n)/SR
put(sfx, s23['start']-0.6, (np.sin(2*np.pi*36.7*tt)+.4*np.sin(2*np.pi*55*tt)) * np.sin(np.linspace(0, np.pi, n))**2, .3)
# grate scrape + clank
s24 = seg('24'); n = int(1.0*SR); tt = np.arange(n)/SR
scrape = bp(rng.standard_normal(n), 900, 2600) * (0.6+0.4*np.sin(2*np.pi*31*tt)) * np.sin(np.linspace(0, np.pi, n))
put(sfx, s24['start']+0.8, echo(scrape, [(.12, .4), (.27, .2)]), .14); put(sfx, s24['start']+1.7, echo(clank(140, .5), [(.12, .35)]))
# flashlights click on, boots on the rungs
s25 = seg('25')
for kk in range(3): put(sfx, s25['start']+0.1+kk*0.22, tone(3200, .03, .1, a=.0003, dec=.006))
for kk in range(9): put(sfx, s25['start']+0.7+kk*0.24, clank(360+rng.random()*60, .22))
# heartbeat again, faster, under the last two lines
h0 = seg('28')['start']; h1 = seg('29')['end'] + 0.6
for kk in np.arange(0, h1-h0, 0.6): put(sfx, h0+kk, thump(.55)); put(sfx, h0+kk+.2, thump(.36))
# final line: hit
s29 = seg('29'); n = int(2.6*SR); tt = np.arange(n)/SR
put(sfx, s29['end']-0.2, (np.sin(2*np.pi*41*tt)+.5*np.sin(2*np.pi*61.5*tt))*env(n, .003, .9) + lp(rng.standard_normal(n), 700)*env(n, .001, .1), .5)

# drone bed: tunnel (low, close), the video (thin, cold), back in the tunnel; cut dead at the silence
n = int(silence_start*SR); tt = np.arange(n)/SR
d = (np.sin(2*np.pi*55*tt) + .5*np.sin(2*np.pi*58.3*tt) + .25*np.sin(2*np.pi*110.5*tt)) * (0.75+0.25*np.sin(2*np.pi*.07*tt))
d += lp(brown(n), 300) * 2
d = d/np.abs(d).max() * np.minimum(1, tt/2)
d = lp(d, 180) * 1.6
a0, a1 = int(v0*SR), int(v1*SR)
d[a0:a1] = hp(d[a0:a1], 90) * 0.5  # thinner during the video
put(bed, 0, d, .09)
# end card sting
n = int(2.5*SR); tt = np.arange(n)/SR
put(sfx, silence_start + SILENCE, (np.sin(2*np.pi*55*tt)+.4*np.sin(2*np.pi*82.4*tt))*env(n, .01, .9), .35)

mix = vo + sfx + bed
mix[int(silence_start*SR):int((silence_start+SILENCE)*SR)] = 0
mix = np.tanh(mix*1.1) * 0.9
os.makedirs('../public/blackout-p5', exist_ok=True)
sf.write('../public/blackout-p5/audio.wav', mix.astype(np.float32), SR)

words = []
for s in segs:
    toks = s['text'].split()
    w = np.array([len(re.sub(r'\W', '', x))+1.5 for x in toks]); w = w/w.sum()
    cur = s['start']; dur = s['end']-s['start']
    for tok, f in zip(toks, w):
        words.append(dict(text=tok, start=round(cur, 3), end=round(cur+f*dur, 3), line=s['id'], voice=s['voice'])); cur += f*dur
json.dump(words, open('../public/blackout-p5/words.json', 'w'), indent=0)
json.dump(dict(lines={s['id']: [round(s['start'], 3), round(s['end'], 3)] for s in segs},
               silenceStart=round(silence_start, 3), endCardStart=round(silence_start+SILENCE, 3), duration=round(end, 3)),
          open('../public/blackout-p5/timing.json', 'w'), indent=1)
print('duration', round(end, 2), 'silence at', round(silence_start, 2))
