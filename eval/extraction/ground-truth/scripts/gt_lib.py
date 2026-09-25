"""Trace-li ground-truth builder library.

Builds long, realistic synthetic award files with ReportLab (same toolchain as
scripts/build_unfpa_ia_2025_29_rehearsal.py) and records, for every pack key,
the true answer (state / statedAbsent / value / quote / page).

Pages for quotes are NOT typed by hand: after the PDF is built, each quote is
located with pdftotext (per page, whitespace-normalised) and the page number
is written into the answer sheet. A quote that is not found on exactly one
page fails the build.
"""
import hashlib
import json
import os
import random
import re
import subprocess

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.platypus import (BaseDocTemplate, Frame, KeepTogether, PageBreak, PageTemplate, Paragraph,
                                Spacer, Table, TableStyle, CondPageBreak)
from reportlab.platypus.tableofcontents import TableOfContents

from packs import PACKS

FOOTER_MARK = 'SYNTHETIC TEST FILE \u2014 Trace-li'
GREY = colors.HexColor('#555555')
ss = getSampleStyleSheet()
TITLE = ParagraphStyle('T', parent=ss['Title'], fontName='Helvetica-Bold', fontSize=18, leading=22, alignment=0, spaceAfter=8)
H1 = ParagraphStyle('H1', parent=ss['Heading1'], fontName='Helvetica-Bold', fontSize=13.5, leading=17, spaceBefore=10, spaceAfter=5)
H2 = ParagraphStyle('H2', parent=ss['Heading2'], fontName='Helvetica-Bold', fontSize=11, leading=14, spaceBefore=7, spaceAfter=3)
B = ParagraphStyle('B', parent=ss['BodyText'], fontName='Helvetica', fontSize=9.4, leading=12.8, spaceAfter=5)
SMALL = ParagraphStyle('S', parent=B, fontSize=8.2, leading=10.6, textColor=GREY)
CELL = ParagraphStyle('C', parent=B, fontSize=8.4, leading=10.4, spaceAfter=0)
CELLB = ParagraphStyle('CB', parent=CELL, fontName='Helvetica-Bold')
MONO = ParagraphStyle('M', parent=B, fontName='Courier', fontSize=8.4, leading=10.6)
TOC1 = ParagraphStyle('TOC1', parent=B, fontSize=9.6, leading=13, leftIndent=6)
TOC2 = ParagraphStyle('TOC2', parent=B, fontSize=8.8, leading=11.5, leftIndent=20)


def make_canvas(header_left, header_right):
    class NumberedCanvas(rl_canvas.Canvas):
        def __init__(self, *a, **k):
            rl_canvas.Canvas.__init__(self, *a, **k)
            self._saved = []

        def showPage(self):
            self._saved.append(dict(self.__dict__))
            self._startPage()

        def save(self):
            n = len(self._saved)
            for st in self._saved:
                self.__dict__.update(st)
                self._decor(n)
                rl_canvas.Canvas.showPage(self)
            rl_canvas.Canvas.save(self)

        def _decor(self, n):
            self.saveState()
            self.setFont('Helvetica', 7.3)
            self.setFillColor(GREY)
            self.drawString(18 * mm, A4[1] - 10 * mm, header_left)
            self.drawRightString(A4[0] - 18 * mm, A4[1] - 10 * mm, header_right)
            self.setStrokeColor(colors.HexColor('#bbbbbb'))
            self.line(18 * mm, A4[1] - 11.5 * mm, A4[0] - 18 * mm, A4[1] - 11.5 * mm)
            self.line(18 * mm, 13 * mm, A4[0] - 18 * mm, 13 * mm)
            self.setFont('Helvetica-Bold', 7.5)
            self.drawString(18 * mm, 9 * mm, FOOTER_MARK)
            self.setFont('Helvetica', 7.5)
            self.drawRightString(A4[0] - 18 * mm, 9 * mm, 'Page %d of %d' % (self._pageNumber, n))
            self.restoreState()
    return NumberedCanvas


class _Doc(BaseDocTemplate):
    def __init__(self, fn, **kw):
        BaseDocTemplate.__init__(self, fn, **kw)
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id='f')
        self.addPageTemplates([PageTemplate(id='p', frames=[frame])])

    def afterFlowable(self, fl):
        if isinstance(fl, Paragraph) and getattr(fl, '_toc', None) is not None:
            self.notify('TOCEntry', (fl._toc, fl.getPlainText(), self.page))


W = A4[0] - 36 * mm


def esc(t):
    return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def norm(t):
    t = t.replace('\u00ad', '')
    return re.sub(r'\s+', ' ', t).strip()


class AwardFile:
    def __init__(self, name, pack_id, title, header_left, seed):
        self.name = name
        self.pack_id = pack_id
        self.pack = PACKS[pack_id]
        self.title = title
        self.header_left = header_left
        self.rng = random.Random(seed)
        self.story = []
        self.fields = {}
        self.traps = []
        self.sec = 0
        self.sub = 0

    # ---------- structure ----------
    def h1(self, text, numbered=True):
        if numbered:
            self.sec += 1
            self.sub = 0
            text = '%d. %s' % (self.sec, text)
        p = Paragraph(esc(text), H1)
        p._toc = 0
        self.story.append(CondPageBreak(40 * mm))
        self.story.append(p)

    def annex(self, letter, text):
        self.annex_pos = getattr(self, 'annex_pos', []) + [(len(self.story), letter)]
        self.story.append(PageBreak())
        p = Paragraph(esc('Annex %s \u2014 %s' % (letter, text)), H1)
        p._toc = 0
        self.story.append(p)

    def h2(self, text):
        self.sub += 1
        p = Paragraph(esc('%d.%d %s' % (self.sec, self.sub, text)), H2)
        p._toc = 1
        self.story.append(CondPageBreak(25 * mm))
        self.story.append(p)

    def h3(self, text):
        self.story.append(Paragraph('<b>%s</b>' % esc(text), B))

    def p(self, text, style=B, raw=False):
        self.story.append(Paragraph(text if raw else esc(text), style))

    def ps(self, texts):
        for t in texts:
            self.p(t)

    def small(self, text):
        self.p(text, SMALL)

    def space(self, h=4):
        self.story.append(Spacer(1, h))

    def pagebreak(self):
        self.story.append(PageBreak())

    def table(self, rows, widths=None, header=True, font=CELL, zebra=False):
        ncol = len(rows[0])
        if widths is None:
            widths = [W / ncol] * ncol
        else:
            tot = sum(widths)
            widths = [w * W / tot for w in widths]
        data = []
        for i, r in enumerate(rows):
            data.append([Paragraph(esc(str(c)), CELLB if header and i == 0 else font) for c in r])
        t = Table(data, colWidths=widths, repeatRows=1 if header else 0)
        st = [('GRID', (0, 0), (-1, -1), 0.35, colors.HexColor('#999999')),
              ('VALIGN', (0, 0), (-1, -1), 'TOP'),
              ('TOPPADDING', (0, 0), (-1, -1), 2.2), ('BOTTOMPADDING', (0, 0), (-1, -1), 2.2)]
        if header:
            st.append(('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e9e9e9')))
        if zebra:
            for i in range(1, len(rows), 2):
                st.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor('#f7f7f7')))
        t.setStyle(TableStyle(st))
        self.story.append(t)
        self.space(6)

    def kv(self, pairs, w1=0.32):
        self.table([[a, b] for a, b in pairs], [w1, 1 - w1], header=False)

    def toc(self):
        self.p('Table of contents', H1)
        t = TableOfContents()
        t.levelStyles = [TOC1, TOC2]
        t.dotsMinLevel = 0
        self.story.append(t)
        self.pagebreak()

    def signatures(self, rows, intro=None):
        if intro:
            self.p(intro)
        data = [['Name', 'Title / role', 'Signature', 'Date']]
        for n, r, d in rows:
            data.append([n, r, '______________________', d])
        self.story.append(KeepTogether([Spacer(1, 4)]))
        self.table(data, [0.24, 0.34, 0.24, 0.18])

    # ---------- evidence ----------
    def _reg(self, key, **spec):
        assert key in self.pack['keys'], (self.name, key)
        assert key not in self.fields, (self.name, 'duplicate', key)
        spec.setdefault('statedAbsent', False)
        spec.setdefault('value', None)
        spec.setdefault('quote', None)
        spec.setdefault('note', '')
        spec.setdefault('trap', None)
        spec.setdefault('occurrence', 'unique')
        self.fields[key] = spec

    def ev(self, key, state, value, quote, pre='', post='', stated=False, note='', trap=None, style=B, occurrence='unique'):
        """Add a paragraph that contains `quote` verbatim and register the answer."""
        self._reg(key, state=state, value=value, quote=quote, statedAbsent=stated, note=note, trap=trap,
                  occurrence=occurrence)
        text = (esc(pre) + (' ' if pre and not pre.endswith(' ') else '') + esc(quote) +
                (' ' if post and not post.startswith(' ') else '') + esc(post))
        self.story.append(KeepTogether([Paragraph(text, style)]))

    def evq(self, key, state, value, quote, stated=False, note='', trap=None, occurrence='unique'):
        """Register an answer whose quote is emitted elsewhere (e.g. in a table cell)."""
        self._reg(key, state=state, value=value, quote=quote, statedAbsent=stated, note=note, trap=trap,
                  occurrence=occurrence)
        return quote

    def silent(self, key, note, trap=None):
        """Genuinely absent: the file does not state this control anywhere (or only as a requirement)."""
        self._reg(key, state='missing', value=None, quote=None, statedAbsent=False, note=note, trap=trap)

    def trap(self, kind, key, description):
        self.traps.append({'kind': kind, 'key': key, 'description': description})

    # ---------- build ----------
    def build(self, outdir):
        missing = [k for k in self.pack['keys'] if k not in self.fields]
        assert not missing, (self.name, 'uncovered keys', missing)
        path = os.path.join(outdir, self.name)
        doc = _Doc(path, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=18 * mm,
                   bottomMargin=19 * mm, title=self.title + ' (synthetic test file)', author='Trace-li ground truth',
                   subject=FOOTER_MARK, invariant=1)
        doc.multiBuild(list(self.story), canvasmaker=make_canvas(self.header_left, 'Ref. ' + self.name.replace('.pdf', '')))
        return path

    def answers(self, path, adir):
        pages = page_texts(path)
        n = len(pages)
        out = {}
        errors = []
        for key in self.pack['keys']:
            f = self.fields[key]
            page = None
            q = f['quote']
            if q is not None:
                nq = norm(q)
                hits = [i + 1 for i, t in enumerate(pages) if nq in t]
                if not hits:
                    errors.append('%s: quote not found: %r' % (key, q))
                elif len(hits) > 1 and f['occurrence'] == 'unique':
                    errors.append('%s: quote on several pages %s: %r' % (key, hits, q))
                else:
                    page = hits[-1] if f['occurrence'] == 'last' else hits[0]
            rule = self.pack['rules'][key]
            if f['state'] == 'present':
                reg = {'state': 'present', 'value': f['value']}
            elif f['state'] == 'negative':
                reg = {'state': 'negative', 'value': f['value']}
            else:
                reg = {'state': 'missing', 'reason': ('Stated absent in this packet: ' + norm(q)) if f['statedAbsent'] and q else 'Not in this packet.'}
            out[key] = {
                'state': f['state'], 'statedAbsent': f['statedAbsent'], 'value': f['value'], 'page': page,
                'quote': norm(q) if q is not None else None, 'note': f['note'],
                'rule': {'kind': rule['kind'], 'title': rule['title'], 'severity': rule['severity']},
                'expectedRegistryValue': reg,
            }
            if f['trap']:
                out[key]['trap'] = f['trap']
        if errors:
            raise SystemExit('\n'.join([self.name] + errors))
        sha = hashlib.sha256(open(path, 'rb').read()).hexdigest()
        sheet = {
            'file': self.name, 'packId': self.pack_id, 'packVersion': self.pack['version'],
            'packName': self.pack['name'], 'sha256': sha, 'pages': n, 'title': self.title,
            'classification': 'synthetic',
            'quoteVerification': 'pdftotext (poppler, default mode) per page; quote is an exact substring after collapsing whitespace runs to one space',
            'traps': self.traps,
            'fields': out,
        }
        jp = os.path.join(adir, self.name.replace('.pdf', '.json'))
        json.dump(sheet, open(jp, 'w'), indent=2, ensure_ascii=False)
        return sheet


def page_texts(path):
    n = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', path], capture_output=True, text=True).stdout).group(1))
    res = []
    for i in range(1, n + 1):
        t = subprocess.run(['pdftotext', '-f', str(i), '-l', str(i), '-enc', 'UTF-8', path, '-'],
                           capture_output=True, text=True).stdout
        res.append(norm(t))
    return res
