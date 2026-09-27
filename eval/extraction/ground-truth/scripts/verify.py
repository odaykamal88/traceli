"""Independent check of the ground-truth set.

For every answers/*.json: sha256 and page count match the PDF; every pack key is
covered exactly (no extras); states/values are consistent; every non-null quote
is found on the stated page of `pdftotext` output (whitespace runs collapsed),
and is reported as raw-exact too when it survives without normalisation.
"""
import glob, hashlib, json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
from packs import PACKS

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FOOT = 'SYNTHETIC TEST FILE \u2014 Trace-li'


def pdftext(path, page=None):
    args = ['pdftotext', '-enc', 'UTF-8'] + (['-f', str(page), '-l', str(page)] if page else []) + [path, '-']
    return subprocess.run(args, capture_output=True, text=True).stdout


def norm(t):
    return re.sub(r'\s+', ' ', t).strip()


ok = True
tot = {'quotes': 0, 'raw_exact': 0}
for jp in sorted(glob.glob(os.path.join(ROOT, 'answers', '*.json'))):
    a = json.load(open(jp))
    pdf = os.path.join(ROOT, a['file'])
    errs = []
    if hashlib.sha256(open(pdf, 'rb').read()).hexdigest() != a['sha256']:
        errs.append('sha256 mismatch')
    n = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout).group(1))
    if n != a['pages']:
        errs.append('page count mismatch')
    if not 12 <= n <= 35:
        errs.append('page count out of range %d' % n)
    pack = PACKS[a['packId']]
    if a['packVersion'] != pack['version']:
        errs.append('pack version')
    if list(a['fields']) != pack['keys']:
        errs.append('keys differ from pack: %s' % set(a['fields']).symmetric_difference(pack['keys']))
    for i in range(1, n + 1):
        if FOOT not in pdftext(pdf, i):
            errs.append('footer missing on page %d' % i)
    for k, v in a['fields'].items():
        if v['state'] not in ('present', 'missing', 'negative'):
            errs.append('%s bad state' % k)
        if v['state'] == 'missing' and v['value'] is not None:
            errs.append('%s missing with value' % k)
        if v['state'] in ('present', 'negative') and (v['value'] is None or v['quote'] is None):
            errs.append('%s present/negative needs value and quote' % k)
        if v['statedAbsent'] and v['quote'] is None:
            errs.append('%s statedAbsent needs quote' % k)
        if (v['quote'] is None) != (v['page'] is None):
            errs.append('%s quote/page mismatch' % k)
        if v['quote'] is not None:
            tot['quotes'] += 1
            raw = pdftext(pdf, v['page'])
            if norm(v['quote']) != v['quote'] or v['quote'] not in norm(raw):
                errs.append('%s quote not on page %s' % (k, v['page']))
            if v['quote'] in raw:
                tot['raw_exact'] += 1
    print('%-40s %s' % (a['file'], 'OK' if not errs else 'FAIL ' + '; '.join(errs)))
    ok = ok and not errs
print('quotes verified: %d (raw-exact without whitespace normalisation: %d)' % (tot['quotes'], tot['raw_exact']))
sys.exit(0 if ok else 1)
