import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import build_gf
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ADIR = os.path.join(OUT, 'answers')
BUILDERS = [build_gf.gf01]
try:
    import build_gf as g
    BUILDERS = [getattr(g, n) for n in ('gf01', 'gf02', 'gf03', 'gf04') if hasattr(g, n)]
    import build_unfpa as u
    BUILDERS += [getattr(u, n) for n in ('u01', 'u02', 'u03') if hasattr(u, n)]
    import build_ocha as o
    BUILDERS += [getattr(o, n) for n in ('o01', 'o02', 'o03') if hasattr(o, n)]
except ImportError:
    pass
only = sys.argv[1:]
import re, subprocess, fill, shell
from gt_lib import PageBreak, Paragraph, H1, esc
TARGET = {'gf01': 18, 'gf02': 24, 'gf03': 14, 'gf04': 32, 'u01': 20, 'u02': 13, 'u03': 27, 'o01': 16, 'o02': 22, 'o03': 30}


def pages_of(path):
    return int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', path], capture_output=True, text=True).stdout).group(1))


def pad(f, k):
    idx, _ = f.annex_pos[-1]
    prev = f.annex_pos[-2][1]
    tail = f.story[idx:]
    f.story = f.story[:idx]
    pool = {'global-fund': fill.GF, 'unfpa': fill.UNFPA, 'ocha-cbpf': fill.OCHA}[f.pack_id]
    months = ['October 2025', 'November 2025', 'December 2025', 'January 2026', 'February 2026', 'March 2026']
    kinds = [('Field monitoring visit reports (summary)', lambda: shell.monitoring_visits(f, 18)),
             ('Staff roster and cost allocation', lambda: shell.staff_roster(f, 32)),
             ('Monthly activity report, ' + months[(k - 1) % 6], lambda: shell.monthly_report(f, [pool, fill.COMMON], months[(k - 1) % 6])),
             ('Bank reconciliation summaries, second half of 2025', lambda: shell.bank_recon(f)),
             ('General provisions (manual extract)', lambda: shell.manual_extract(f, [fill.COMMON, pool], 7, 2)),
             ('Training log', lambda: shell.training_log(f, 30)),
             ('Coordination meeting minutes', lambda: (shell.minutes(f, fill.dstr(fill.dt.date(2025, 11, 20) + fill.dt.timedelta(days=30 * k)), fill.people(f.rng, 6), fill.pick(f.rng, shell.GENERIC_ITEMS, 7)), shell.risks(f, 8))),
             ('Asset register', lambda: shell.asset_register(f, 36))]
    title, fn = kinds[(k - 1 + len(f.name)) % len(kinds)]
    f.story.append(PageBreak())
    para = Paragraph(esc('Annex %s.%d \u2014 %s' % (prev, k, title)), H1)
    para._toc = 0
    f.story.append(para)
    fn()
    f.story.extend(tail)
    f.annex_pos[-1] = (len(f.story) - len(tail), f.annex_pos[-1][1])

summary = []
for b in BUILDERS:
    if only and b.__name__ not in only:
        continue
    f = b()
    path = f.build(OUT)
    k = 0
    while pages_of(path) < TARGET[b.__name__]:
        k += 1
        f = b()
        for j in range(1, k + 1):
            pad(f, j)
        path = f.build(OUT)
    sheet = f.answers(path, ADIR)
    c = {'present': 0, 'missing': 0, 'negative': 0, 'statedAbsent': 0}
    for v in sheet['fields'].values():
        c[v['state']] += 1
        c['statedAbsent'] += v['statedAbsent']
    print('%-40s %3d pages  keys=%d  %s' % (sheet['file'], sheet['pages'], len(sheet['fields']), c))
