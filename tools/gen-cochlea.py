#!/usr/bin/env python3
"""Regenerate Fig. 1 (the cochlea in index.html's About section) in place.

The drawing is a logarithmic spiral of 2.6 turns whose length stands for a
30.2 mm cochlear duct (CDL, base -> apex). Along its outer wall lies a
MED-EL FLEX28 array: 12 channels 2.1 mm apart (23.1 mm stimulation range),
the apical 5 single contacts and the basal 7 contact pairs, the deepest
channel 28.0 mm from the base, i.e. 2.2 mm short of the apex. Ticks mark
the Greenwood place-frequency map (human: F = 165.4 (10^(2.1x) - 0.88),
x = fraction of length from the apex).

Edit the constants below, then run from the repo root:
    python3 tools/gen-cochlea.py
It rewrites the <svg class="cochlea"> contents, viewBox and size; the <title>
and <figcaption> are prose and stay hand-edited. Stdlib only.
"""
import math
CX, CY = 200, 196
TURNS = 2.6
TH_MAX = TURNS * 2 * math.pi
R0, R1 = 13.0, 168.0
b = math.log(R1 / R0) / TH_MAX
ROT = math.radians(-58)
CDL = 30.2
DEEPEST, PITCH, NCH, NSINGLE = 28.0, 2.1, 12, 5
OFF = 4.2            # array centerline, px inside the lateral wall
PAIR = 2.1           # half-separation of a contact pair, px
def rad(th): return R0 * math.exp(b * th)
def pt(th, off=0.0):
    r = rad(th) - off
    a = th + ROT
    return CX + r * math.cos(a), CY + r * math.sin(a)
N = 600
ths = [TH_MAX * i / N for i in range(N + 1)]
pts = [pt(t) for t in ths]
cum = [0.0]
for i in range(1, len(pts)):
    cum.append(cum[-1] + math.dist(pts[i - 1], pts[i]))
L = cum[-1]
def th_at(s):  # s = path length from the apex end
    for i in range(1, len(cum)):
        if cum[i] >= s:
            f = (s - cum[i - 1]) / (cum[i] - cum[i - 1])
            return ths[i - 1] + f * (ths[i] - ths[i - 1])
    return TH_MAX
def th_from_base_mm(mm): return th_at(L * (1 - mm / CDL))
def path(points): return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in points)
duct = path(pts[::3] + ([pts[-1]] if (len(pts) - 1) % 3 else []))
inner = path([pt(t, rad(t) * 0.14) for t in ths if t >= TH_MAX * 40 / 220][::3])
# array carrier: base -> deepest contact, along the lateral wall
th_tip = th_from_base_mm(DEEPEST)
arr_ths = [t for t in ths if t >= th_tip]
array = path([pt(th_tip, OFF)] + [pt(t, OFF) for t in arr_ths[::3]] + [pt(TH_MAX, OFF)])
contacts = []  # (channel, x, y), channel 1 = apical
for k in range(NCH):
    mm = DEEPEST - k * PITCH
    th = th_from_base_mm(mm)
    if k < NSINGLE:
        contacts.append((k + 1, *pt(th, OFF)))
    else:
        contacts.append((k + 1, *pt(th, OFF - PAIR)))
        contacts.append((k + 1, *pt(th, OFF + PAIR)))
bx, by = pt(TH_MAX, OFF)
dx, dy = pt(TH_MAX)[0] - pt(TH_MAX - 0.05)[0], pt(TH_MAX)[1] - pt(TH_MAX - 0.05)[1]
n = math.hypot(dx, dy); dx, dy = dx / n, dy / n
lead = f'M{bx:.1f} {by:.1f} L{bx + dx * 34:.1f} {by + dy * 34:.1f}'
ticks = []
for F, lab in [(8000, '8k'), (4000, '4k'), (2000, '2k'), (1000, '1k'), (500, '500'), (250, '250')]:
    x = math.log10(F / 165.4 + 0.88) / 2.1
    th = th_at(x * L)
    r = rad(th)
    xo, yo = pt(th); xi, yi = pt(th, -7); xl, yl = pt(th, -17)
    ticks.append((lab, xo, yo, xi, yi, xl, yl, x))
# The fill/stroke/font-size attributes are a no-CSS fallback only (every
# rule in css/onepager.css outranks them): without them an unstyled SVG
# paints each path as a solid black blob the width of the page.
out = [f'<path class="cochlea-duct" d="{duct}" pathLength="1" fill="none" stroke="currentColor"/>',
       f'<path class="cochlea-membrane" d="{inner}" fill="none"/>',
       f'<path class="cochlea-lead" d="{lead}" fill="none" stroke="currentColor"/>',
       f'<path class="cochlea-array" d="{array}" fill="none"/>']
for lab, xo, yo, xi, yi, xl, yl, x in ticks:
    out.append(f'<g class="cochlea-tick" fill="currentColor" font-size="10.5"><line x1="{xo:.1f}" y1="{yo:.1f}" x2="{xi:.1f}" y2="{yi:.1f}"/><text x="{xl:.1f}" y="{yl:.1f}">{lab}</text></g>')
# stagger the reveal base -> apex, the way an array goes in
order = sorted(range(len(contacts)), key=lambda i: -contacts[i][0])
for rank, i in enumerate(order):
    ch, x, y = contacts[i]
    out.append(f'<circle class="cochlea-contact" cx="{x:.1f}" cy="{y:.1f}" r="{1.9 if ch > NSINGLE else 2.3}" fill="currentColor" style="--i:{rank}"/>')
xs = [p[0] for p in pts] + [bx + dx * 34] + [t[5] for t in ticks]
ys = [p[1] for p in pts] + [by + dy * 34] + [t[6] for t in ticks]
pad = 14
vbw, vbh = max(xs) - min(xs) + 2 * pad, max(ys) - min(ys) + 2 * pad
vb = f'{min(xs) - pad:.0f} {min(ys) - pad:.0f} {vbw:.0f} {vbh:.0f}'
# width/height: no-CSS fallback size (css/onepager.css scales it to the column)
size = f'width="{vbw:.0f}" height="{vbh:.0f}"'
import re
HTML = 'index.html'
t = open(HTML, encoding='utf-8').read()
frag = '\n'.join('                ' + l for l in out)
t, n = re.subn(r'(<svg class="cochlea" )viewBox="[^"]*"(?: width="[^"]*" height="[^"]*")?( role="img" aria-labelledby="cochlea-title">\n\s*<title[^\n]*</title>\n)(.*?)(\n\s*</svg>)',
              lambda m: m.group(1) + f'viewBox="{vb}" {size}' + m.group(2) + frag + m.group(4), t, flags=re.S)
if n != 1:
    raise SystemExit('could not find the cochlea <svg> in index.html')
open(HTML, 'w', encoding='utf-8').write(t)
print('viewBox', vb, 'L(px)=', round(L), 'px/mm=', round(L / CDL, 2))
print('apical contact r(px)=', round(rad(th_tip), 1), 'turns from base=', round((TH_MAX - th_tip) / (2 * math.pi), 2), 'deg=', round(math.degrees(TH_MAX - th_tip)))
print('ticks (fraction from apex):', [(t[0], round(t[7], 3)) for t in ticks])
