"""The Switch soundtrack.  Run from switch/: python3 build_audio.py"""
import sys; sys.path.insert(0, '../scripts')
from audiokit import *
tr = Track(offset=1.0, tail=3.6); S, E, put = tr.S, tr.E, tr.put
ev = dict(
    battery=0.2, mon=S('02') + 0.1, wed=S('03') + 0.1, fri=S('04') + 0.1, quit=S('05') + 1.2,
    flip=S('07') + 0.55, days=[S('09') + 0.6 + i * 0.25 for i in range(7)],
    rain=[S('10') - 0.1, E('12') + 0.8], arrive=E('12') + 0.05,
)
put(tr.sfx, ev['battery'], pop(1200), .15)
for k in ('mon', 'wed', 'fri'): put(tr.sfx, ev[k], pop(900), .18)
# power-down whine on Friday
n = int(1.2*SR); tt = np.arange(n)/SR
put(tr.sfx, ev['fri'] + 0.3, np.sin(2*np.pi*np.cumsum(900*np.exp(-tt*2.2))/SR)*np.exp(-tt*1.5), .06)
put(tr.sfx, ev['quit'], thud(), .4)
# the switch: a big mechanical click + hum swelling in
n = int(.08*SR); click = hp(noise(n), 1500)*env(n, .0003, .01)*1.5 + lp(noise(n), 800)*env(n, .0005, .02)
put(tr.sfx, ev['flip'], click, .8); put(tr.sfx, ev['flip'], boom(), .35)
for t in ev['days']: put(tr.sfx, t, click, .35)
r0, r1 = ev['rain']; rn = rain(r1 - r0); rn *= np.minimum(1, np.arange(len(rn))/SR/0.8) * np.clip((r1-r0-np.arange(len(rn))/SR)/1.0, 0, 1)
put(tr.sfx, r0, rn, .05)
put(tr.sfx, ev['arrive'], pop(1400), .2)
# music: hopeful-to-tired A minor bed draining until the switch, silence, then driving pulse
f = ev['flip']
ch = [['C3','G3','E4'], ['A2','E3','C4'], ['F2','C3','A3'], ['E2','B2','G#3']]
cd = (S('06'))/4
for k, c in enumerate(ch): put(tr.bed, k*cd, pad(c, cd+1.5, att=1.0 if k else 2.0, bright=1400 - k*250), .5 - k*0.06)
for b in np.arange(S('02'), S('04') + 0.3, 60/110): put(tr.bed, b, kick(), .15 * max(0.2, 1 - (b - S('02'))/(S('04') + 0.3 - S('02'))))
bpm = 110; beat = 60/bpm; bar = 4*beat
prog = [['A2','E3','C4'], ['F2','C3','A3'], ['C3','G3','E4'], ['G2','D3','B3']]; t = f; k = 0
while t < tr.end-0.4:
    c = prog[k % 4]; put(tr.bed, t, pad(c, bar+1.2, att=.15, bright=1700), .5)
    for b in range(8):
        put(tr.bed, t+b*beat/2, pluck(hz(c[(b*2) % 3])*2, .45, .2))
        put(tr.bed, t+b*beat/2+beat/4, hat(), .05)
    if t < tr.vo_end - 0.5:
        for b in range(4): put(tr.bed, t+b*beat, kick(), .3)
    t += bar; k += 1
ev['hits'] = [ev['flip'], S('09'), ev['arrive']]
tr.write('../public/switch', ev, ref=dict(prog='am', swell=ev['flip'], dip=(S('05') + 1.0, ev['flip'])),
         epic=dict(prog='em', bpm=108, levels=[(0, 1), (S('04'), 0), (ev['flip'], 3)], climax=ev['flip']))
