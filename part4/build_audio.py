"""Builds the Part 4 soundtrack: narration, synthesized SFX and drone.
Writes ../public/blackout-p4/{audio.wav,words.json,timing.json}."""
import json, os, re, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
SR = 48000; OFFSET = 0.35; SILENCE = 1.3; ENDCARD = 3.6
rng = np.random.default_rng(11)

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
    if id_ == '08':   # a voice from under the street: thin, distant, echoing
        a = echo(bp(a, 350, 3200) * 1.6, [(.11, .45), (.23, .3), (.37, .18)])
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

def paper(d=0.7, g=.12):
    n = int(d*SR); return bp(rng.standard_normal(n), 1500, 6500) * np.sin(np.linspace(0, np.pi, n))**2 * g
def clank(f=420, g=.5):
    n = int(.5*SR); tt = np.arange(n)/SR
    x = sum(np.sin(2*np.pi*f*k*tt)*w for k, w in ((1, 1), (2.76, .5), (5.4, .25))) * env(n, .001, .09)
    return (x + lp(rng.standard_normal(n), 3000)*env(n, .0005, .01)) * g
def static(d, g): n = int(d*SR); return bp(rng.standard_normal(n), 800, 5000) * g

# hook: page turn under the first line
put(sfx, 0.0, paper(0.8, .14))
# red-X montage: spray hiss on "Every door got a red X"
s4 = seg('04'); put(sfx, s4['start']+0.6, paper(0.5, .1)); put(sfx, s4['start']+1.0, paper(0.4, .08))
# voice under the street: faint static wash
put(sfx, seg('06')['start']+1.2, static(seg('08')['end']-seg('06')['start'], .02))
# grate lift: long metal scrape then a heavy clunk
s9 = seg('09'); n = int(1.0*SR); tt = np.arange(n)/SR
scrape = bp(rng.standard_normal(n), 900, 2600) * (0.6+0.4*np.sin(2*np.pi*31*tt)) * np.sin(np.linspace(0, np.pi, n))
put(sfx, s9['start']+0.2, scrape, .16); put(sfx, s9['start']+1.1, clank(140, .55))
# engine start + idle rumble that swells as the headlights swing in
s13 = seg('13'); e0 = s13['start'] + 1.0; e1 = seg('16')['start'] + 0.6
n = int((e1-e0)*SR); tt = np.arange(n)/SR
crank = (0.5+0.5*np.sign(np.sin(2*np.pi*9*tt))) * np.exp(-tt/0.5)
rumble = lp(brown(n), 170, 4); rumble /= np.abs(rumble).max()+1e-9
rumble = (rumble + 0.6*np.sin(2*np.pi*(36+4*np.minimum(1, tt))*tt) + crank*lp(rng.standard_normal(n), 400)) * np.minimum(1, tt/0.4)
rumble *= np.linspace(0.18, 0.34, n); rumble[-int(.25*SR):] *= np.linspace(1, 0, int(.25*SR))
put(sfx, e0, rumble)
# climbing down: rung clanks
s16 = seg('16')
for k, f in enumerate((380, 360, 400, 350, 390)): put(sfx, s16['end']+0.05+k*0.17, clank(f, .32 - k*0.04))
# underground: drips + room murmur from line 17 to the notebook
u0 = seg('17')['start'] - 0.3; u1 = seg('26')['start']
for k in range(int((silence_start-u0)/0.9)):
    n = int(.12*SR); tt = np.arange(n)/SR; f = 1400 + 900*rng.random()
    put(sfx, u0 + k*0.9 + rng.random()*0.5, np.sin(2*np.pi*(f + 3000*tt)*tt)*env(n, .001, .025), .07)
m0 = seg('19')['start']; n = int((u1-m0)*SR); tt = np.arange(n)/SR
murmur = bp(rng.standard_normal(n), 220, 900, 3) * (0.6+0.4*np.sin(2*np.pi*1.7*tt)*np.sin(2*np.pi*.6*tt))
murmur *= np.minimum(1, tt/1.2) * np.minimum(1, (n/SR - tt)/1.0)
put(sfx, m0, murmur, .05)
# notebook opens
put(sfx, seg('27')['start']-0.1, paper(0.9, .16))
# heartbeat under the message
s29 = seg('29')
def thump(g=.8):
    n = int(.4*SR); tt = np.arange(n)/SR; return np.sin(2*np.pi*55*tt)*env(n, .004, .09)*g
for k in np.arange(0, s29['end']-s29['start']+1.5, 0.85): put(sfx, s29['start']+k, thump(.55)); put(sfx, s29['start']+k+.26, thump(.38))
# "Tomorrow's." — hit
s31 = seg('31'); n = int(2.2*SR); tt = np.arange(n)/SR
put(sfx, s31['start']-0.05, (np.sin(2*np.pi*48*tt)+.5*np.sin(2*np.pi*72*tt))*env(n, .003, .7) + lp(rng.standard_normal(n), 900)*env(n, .001, .08), .5)

# drone bed, two halves: street (colder) and tunnel (lower, closer); cut dead at the silence
n = int(silence_start*SR); tt = np.arange(n)/SR
d = (np.sin(2*np.pi*55*tt) + .5*np.sin(2*np.pi*58.3*tt) + .25*np.sin(2*np.pi*110.5*tt)) * (0.75+0.25*np.sin(2*np.pi*.07*tt))
d += lp(brown(n), 300) * 2
d = d/np.abs(d).max() * np.minimum(1, tt/2)
tun = int((seg('17')['start']-0.3)*SR); d[tun:] = lp(d[tun:], 180) * 1.6
put(bed, 0, d, .09)
# end card sting
n = int(2.5*SR); tt = np.arange(n)/SR
put(sfx, silence_start + SILENCE, (np.sin(2*np.pi*55*tt)+.4*np.sin(2*np.pi*82.4*tt))*env(n, .01, .9), .35)

mix = vo + sfx + bed
mix[int(silence_start*SR):int((silence_start+SILENCE)*SR)] = 0
mix = np.tanh(mix*1.1) * 0.9
os.makedirs('../public/blackout-p4', exist_ok=True)
sf.write('../public/blackout-p4/audio.wav', mix.astype(np.float32), SR)

words = []
for s in segs:
    toks = s['text'].split()
    w = np.array([len(re.sub(r'\W', '', x))+1.5 for x in toks]); w = w/w.sum()
    cur = s['start']; dur = s['end']-s['start']
    for tok, f in zip(toks, w):
        words.append(dict(text=tok, start=round(cur, 3), end=round(cur+f*dur, 3), line=s['id'], voice=s['voice'])); cur += f*dur
json.dump(words, open('../public/blackout-p4/words.json', 'w'), indent=0)
json.dump(dict(lines={s['id']: [round(s['start'], 3), round(s['end'], 3)] for s in segs},
               silenceStart=round(silence_start, 3), endCardStart=round(silence_start+SILENCE, 3), duration=round(end, 3)),
          open('../public/blackout-p4/timing.json', 'w'), indent=1)
print('duration', round(end, 2), 'silence at', round(silence_start, 2))
