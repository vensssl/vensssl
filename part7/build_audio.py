"""Builds the Part 7 (finale) soundtrack: narration, synthesized SFX, drone and the closing chord.
Writes ../public/blackout-p7/{audio.wav,words.json,timing.json}."""
import json, os, re, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
SR = 48000; OFFSET = 0.25; SILENCE = 1.3; ENDCARD = 4.5
rng = np.random.default_rng(7)

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
def echo(x, taps):
    out = np.concatenate([x, np.zeros(int(max(d for d, _ in taps)*SR))])
    for d, g in taps: i = int(d*SR); out[i:i+len(x)] += x*g
    return out
def radio(x):  # through a handheld radio: band-limited, a little crushed, hiss under it
    y = np.tanh(bp(x, 350, 3200, 3) * 3) * 0.5
    return y + bp(rng.standard_normal(len(y)), 2000, 8000) * 0.012

rows = [l.rstrip('\n').split('\t') for l in open('lines.tsv')]
segs, clips, t = [], [], OFFSET
for id_, voice, speed, pause, text in rows:
    a = load(f'assets/vo-lines/{id_}.wav')
    n = len(a)
    if voice == 'bm_george':
        a = radio(a) if id_ == '29' else echo(a, [(.11, .16), (.24, .08)])  # 06 on the street, 29 over the radio
    elif voice == 'bf_emma':  # Dana, in person at last: close and dry, a short street slap
        a = echo(hp(a, 120), [(.07, .1), (.16, .05)])
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
def relay(g=.6):
    n = int(.9*SR); tt = np.arange(n)/SR
    return (np.sin(2*np.pi*42*tt)*env(n, .002, .25) + bp(rng.standard_normal(n), 2000, 7000)*env(n, .0005, .015)*.7) * g
def whoosh(d=.45, g=.15):
    n = int(d*SR); return bp(rng.standard_normal(n), 400, 4000) * np.sin(np.linspace(0, np.pi, n))**3 * g
def thump(g=.8):
    n = int(.4*SR); tt = np.arange(n)/SR; return np.sin(2*np.pi*55*tt)*env(n, .004, .09)*g
def hit(d=2.2, f=46, g=.5):
    n = int(d*SR); tt = np.arange(n)/SR
    return ((np.sin(2*np.pi*f*tt)+.5*np.sin(2*np.pi*f*1.5*tt))*env(n, .003, d*.35) + lp(rng.standard_normal(n), 900)*env(n, .001, .08)) * g
def pencil(d, g=.06):
    n = int(d*SR); x = bp(rng.standard_normal(n), 2500, 7000)
    tt = np.arange(n)/SR; strokes = (np.sin(2*np.pi*7.5*tt + rng.random()*6) > -0.2).astype(float)
    return x * lp(strokes, 40) * np.minimum(1, tt/.02) * np.minimum(1, (n/SR-tt)/.05) * g
def crackle(d, g=.2, dens=40):
    n = int(d*SR); x = np.zeros(n)
    for _ in range(int(d*dens)):
        i = rng.integers(0, max(1, n-2000)); m = int(rng.integers(200, 1600))
        x[i:i+m] += bp(rng.standard_normal(m), 1500, 9000)[:n-i] * env(m, .0002, .004)[:n-i] * rng.random()
    return x * g
def heartbeats(t0, t1, gap, g=.5):
    for kk in np.arange(0, t1-t0, gap): put(sfx, t0+kk, thump(g)); put(sfx, t0+kk+gap*.32, thump(g*.66))
def engines(t0, t1, g):
    n = int((t1-t0)*SR); tt = np.arange(n)/SR
    x = lp(rng.standard_normal(n), 90, 4) * 6 * (0.7 + 0.3*np.sign(np.sin(2*np.pi*13*tt)))
    x += 0.4*np.sin(2*np.pi*31*tt)
    x *= np.minimum(1, tt/.6) * np.minimum(1, (n/SR-tt)/.6)
    put(sfx, t0, lp(x, 200), g)
def hum(t0, t1, g, f0=60):  # mains hum, faded at both ends
    n = int((t1-t0)*SR); tt = np.arange(n)/SR
    x = (np.sin(2*np.pi*f0*tt) + .5*np.sin(2*np.pi*f0*2*tt) + .25*np.sin(2*np.pi*f0*3*tt)) * np.minimum(1, tt/.4) * np.minimum(1, (n/SR-tt)/.3)
    put(sfx, t0, x, g)
def riser(t0, d, f0, f1, g):  # a pitch sweep, louder as it climbs
    n = int(d*SR); f = f0 + (f1-f0)*np.linspace(0, 1, n)**2
    x = np.sin(2*np.pi*np.cumsum(f)/SR) * np.linspace(0, 1, n)**2
    put(sfx, t0, x, g)
def step(g=.3):  # a running footstep on wet asphalt
    n = int(.18*SR); return (lp(rng.standard_normal(n), 600)*env(n, .001, .03)*2 + bp(rng.standard_normal(n), 1500, 5000)*env(n, .001, .02)*.4) * g
def beep(f=1400, g=.12): return tone(f, .12, g, a=.002, dec=.05)
def flicker_buzz(g=.25):  # a bulb stuttering: 3 quick electrical buzzes
    n = int(.12*SR); tt = np.arange(n)/SR
    return (np.sign(np.sin(2*np.pi*120*tt)) * .3 + bp(rng.standard_normal(n), 800, 5000)) * env(n, .002, .05) * g

# HOOK: the grid spinning up on "back on", then the hit on "the last thing I'll ever do"
riser(L('01') + 0.2, LE('01') - L('01') + 0.2, 50, 420, .1)
put(sfx, LE('01') + 0.05, relay(.8))
put(sfx, L('02') + 0.1, hit(2.6, 41, .55))
# recap: breakers dropping, then his lit eyes
for k in range(4): put(sfx, L('04') + 2.0 + k*0.3, relay(.35 + .1*k))
riser(L('05') + 1.6, 1.4, 70, 240, .08); put(sfx, LE('05') - 0.1, crackle(.8, .25))
# the street: engines, his grip humming, the flare
engines(L('05') - 0.2, L('11') + 1.5, .45)
hum(L('07'), LE('07') + 0.3, .07, 60)
put(sfx, L('07') + 0.9, crackle(LE('07') - L('07'), .18))
put(sfx, L('08') + 0.6, whoosh(.5, .3))  # flare thrown
n = int(4.5*SR); put(sfx, L('08') + 1.0, bp(rng.standard_normal(n), 1200, 9000) * np.minimum(1, np.arange(n)/SR/.05) * np.exp(-np.arange(n)/SR/2.5), .07)  # flare fizz
put(sfx, L('08') + 1.0, thump(.7))
# running
tcur = L('10') + 0.2
while tcur < LE('11'):
    put(sfx, tcur, step(.35)); tcur += 0.29
heartbeats(L('10'), LE('11'), 0.45, .35)
# Dana's story: quiet. A dead streetlight ticking, pencil on "I wrote in your notebook"
for kk in np.arange(L('12'), LE('15'), 1.7): put(sfx, kk, tone(3400, .03, .03, a=.0004, dec=.01))
put(sfx, L('15') + 0.4, pencil(LE('15') - L('15') - 0.4, .045))
# Wrigley: one lit place. Generators thrumming, then a silence of forty thousand people
n = int((L('22') - L('18'))*SR); tt = np.arange(n)/SR
gen = (np.sin(2*np.pi*48*tt) + .6*np.sin(2*np.pi*96*tt)) * (0.8 + 0.2*np.sin(2*np.pi*7*tt)) * np.minimum(1, tt/1.2) * np.minimum(1, (n/SR-tt)/.6)
put(sfx, L('18'), lp(gen, 300), .08)
put(sfx, L('19') + 0.2, relay(.6))  # the stadium lights banging on
n = int((LE('21') - L('20'))*SR); put(sfx, L('20'), bp(rng.standard_normal(n), 200, 1200) * np.minimum(1, np.arange(n)/SR/1.0), .025)  # wind across empty-sounding stands
put(sfx, L('21') + 1.0, hit(2.4, 43, .5))
heartbeats(L('22'), LE('23'), 0.8, .35)
# the plan: every volt into one line
riser(L('24') + 0.3, LE('26') - L('24'), 40, 600, .1)
put(sfx, LE('26') - 0.1, thump(.9))
# the control room: hum, the keypad, his voice on the radio
hum(L('27') - 0.2, L('30'), .04, 60)
s28 = seg('28'); dur = s28['end'] - s28['start']
for k, f in enumerate((1209, 1336, 1477, 1209)):  # zero, nine, one, four
    put(sfx, s28['start'] + dur*(0.52 + k*0.12), beep(f, .14))
put(sfx, L('29') - 0.15, crackle(.3, .2)); put(sfx, LE('29'), crackle(.25, .2))
# the breaker: clunk, the surge through him, held
put(sfx, L('30') + 0.55, thump(1.0)); put(sfx, L('30') + 0.55, relay(1.0))
n = int((LE('31') - L('30') + 1.2)*SR); tt = np.arange(n)/SR
f = 55 + 900*np.linspace(0, 1, n)**2
surge = np.sin(2*np.pi*np.cumsum(f)/SR) * np.minimum(1, tt/.3) * np.minimum(1, (n/SR-tt)/.1)
put(sfx, L('30') + 0.6, surge, .1)
put(sfx, L('30') + 0.6, crackle(n/SR, .35, 90))
put(sfx, LE('31') + 0.6, hit(3.2, 38, .65))
# the lights coming back: relays climbing in pitch, block by block
b0, b1 = L('32') + 1.6, LE('32')
for k, tcur in enumerate(np.linspace(b0, b1, 9)):
    put(sfx, tcur, relay(.25)); put(sfx, tcur, tone(440*2**(k/12*2), .5, .05, a=.005, dec=.25))
# the last line: three flickers, then the final hit
s38 = seg('38')
for k in range(3): put(sfx, s38['start'] + 1.2 + k*0.35, flicker_buzz(.22))
put(sfx, LE('39') - 0.1, hit(3.0, 39, .5))

# drone bed until the breaker, then a warm, sad chord for the lights coming back
d_end = L('30') + 0.5
n = int(d_end*SR); tt = np.arange(n)/SR
d = (np.sin(2*np.pi*55*tt) + .5*np.sin(2*np.pi*58.3*tt) + .25*np.sin(2*np.pi*110.5*tt)) * (0.75+0.25*np.sin(2*np.pi*.07*tt))
d += lp(brown(n), 300) * 2
d = d/np.abs(d).max() * np.minimum(1, tt/1.2) * np.minimum(1, (n/SR-tt)/.2)
d = lp(d, 180) * 1.6
q0, q1 = int(L('12')*SR), int(LE('15')*SR)
d[q0:q1] *= 0.55  # Dana's story: the bed pulls back
put(bed, 0, d, .09)
c0 = L('32') - 0.3; c1 = silence_start
n = int((c1-c0)*SR); tt = np.arange(n)/SR
chord = sum(np.sin(2*np.pi*f*tt + rng.random()*6)*w for f, w in ((110, 1), (164.8, .6), (220, .5), (277.2, .35), (329.6, .25)))
chord = lp(chord, 1400) * np.minimum(1, tt/3.0) * np.minimum(1, (n/SR-tt)/1.5) * (0.85 + 0.15*np.sin(2*np.pi*.2*tt))
s38t = int((s38['start'] - c0)*SR)
chord[s38t:] *= np.linspace(1, 0.35, n - s38t)  # it sours a little at the very end
put(bed, c0, chord / np.abs(chord).max(), .07)
# end card: one soft final chord
n = int(4*SR); tt = np.arange(n)/SR
put(sfx, silence_start + SILENCE, sum(np.sin(2*np.pi*f*tt)*w for f, w in ((55, 1), (82.4, .5), (110, .4), (138.6, .2))) * env(n, .02, 1.4), .3)

mix = vo + sfx + bed
mix[int(silence_start*SR):int((silence_start+SILENCE)*SR)] = 0
mix = np.tanh(mix*1.1) * 0.9
os.makedirs('../public/blackout-p7', exist_ok=True)
sf.write('../public/blackout-p7/audio.wav', mix.astype(np.float32), SR)

words = []
for s in segs:
    toks = s['text'].split()
    w = np.array([len(re.sub(r'\W', '', x))+1.5 for x in toks]); w = w/w.sum()
    cur = s['start']; dur = s['end']-s['start']
    for tok, f in zip(toks, w):
        words.append(dict(text=tok, start=round(cur, 3), end=round(cur+f*dur, 3), line=s['id'], voice=s['voice'])); cur += f*dur
json.dump(words, open('../public/blackout-p7/words.json', 'w'), indent=0)
json.dump(dict(lines={s['id']: [round(s['start'], 3), round(s['end'], 3)] for s in segs},
               silenceStart=round(silence_start, 3), endCardStart=round(silence_start+SILENCE, 3), duration=round(end, 3)),
          open('../public/blackout-p7/timing.json', 'w'), indent=1)
print('duration', round(end, 2), 'silence at', round(silence_start, 2))
