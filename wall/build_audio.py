"""The Wall soundtrack.  Run from wall/: python3 build_audio.py"""
import sys; sys.path.insert(0, '../scripts')
from audiokit import *
tr = Track(offset=1.0, tail=5.0); S, E, put = tr.S, tr.E, tr.put
ev = dict(
    crowd=0.15, wall=S('02') + 0.15, clock=S('03') + 0.1, reps=S('04') + 0.05,
    lightsOff=S('05') + 0.5, leave=[S('06') + 0.3 + i * 0.42 for i in range(6)],
    plant=S('10') + 0.2, climb=[E('11') + 0.05, E('11') + 2.0],
)
ev['top'] = ev['climb'][1]
for i in range(7): put(tr.sfx, ev['crowd'] + i*0.09, pop(700 + i*60), .12)
# wall rises: low rumble + thud
n = int(1.1*SR); put(tr.sfx, ev['wall'], lp(noise(n), 200)*np.sin(np.linspace(0, np.pi, n)), .5); put(tr.sfx, ev['wall'] + 1.0, thud(), .6)
# alarm: three short rings
for k in range(3):
    n = int(.12*SR); tt = np.arange(n)/SR
    put(tr.sfx, ev['clock'] + k*.17, np.sign(np.sin(2*np.pi*1800*tt))*np.sin(2*np.pi*14*tt)*env(n, .002, .08), .05)
for k in range(5): put(tr.sfx, ev['reps'] + 0.3 + k*0.22, tick(), .3)
put(tr.sfx, ev['lightsOff'], clunk(), .45)
for k, t in enumerate(ev['leave']):
    for j in range(3): put(tr.sfx, t + j*0.16, step(), .25 - 0.03*j)
put(tr.sfx, ev['plant'], thud(), .45)
c0, c1 = ev['climb']
for k in range(6): put(tr.sfx, c0 + (c1-c0)*(k+.6)/6, step(), .5)
put(tr.sfx, S('10'), riser(ev['top'] - S('10')), .05)
put(tr.sfx, ev['top'], boom(), .55)
# music: D minor pulse until line 07, near-silence, build, then bright after the top
q = S('07')
ch = [['D3','A3','F4'], ['A#2','F3','D4'], ['F3','C4','A4'], ['C3','G3','E4']]
cd = q/4
for k, c in enumerate(ch): put(tr.bed, k*cd, pad(c, cd+1.5, att=1.2 if k else 2.4), .5)
for b in np.arange(S('03'), q-0.3, 60/80): put(tr.bed, b, kick(), .17)
put(tr.bed, q, pad(['D2','D3'], 2.4, att=.05, bright=300), .4)
arp = ['D4','F4','A4','D5','A4','F4','C4','E4','G4','C5','G4','E4']
a0, a1 = S('08'), ev['top']; t = a0; k = 0
while t < a1-0.05:
    p = (t-a0)/(a1-a0); put(tr.bed, t, pluck(hz(arp[k % 12]), .8, .18+.35*p)); t += .32-.16*p; k += 1
bar = 4*60/100; prog = [['A#2','F3','D4'], ['F3','C4','A4'], ['C3','G3','E4'], ['D3','A3','F4']]; t = ev['top']; k = 0
while t < tr.end-0.4:
    c = prog[k % 4]; put(tr.bed, t, pad(c, bar+1.2, att=.2, bright=1600), .55)
    for b in range(8): put(tr.bed, t+b*bar/8, pluck(hz(c[(b*2) % 3])*2, .5, .2))
    t += bar; k += 1
tr.write('../public/wall', ev, replace=[('nobody is', "nobody's")], ref=dict(prog='dm', swell=ev['top'], dip=(S('07'), S('08'))))
