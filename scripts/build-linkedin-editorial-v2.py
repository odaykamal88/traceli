#!/usr/bin/env python3
"""Traceli's LinkedIn editorial template: editable type, image cover, tagged PDF."""
from pathlib import Path
import json
import subprocess
import hashlib
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (DictionaryObject as D, ArrayObject as A, NameObject as N,
                          NumberObject as I, TextStringObject as T, BooleanObject as B)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/social/before-you-sign-01-linkedin-v2'
TMP = ROOT / 'tmp/pdfs/linkedin-v2'
PDF = ROOT / 'output/pdf/before-you-sign-01-linkedin-v2.pdf'
W, H = 1080, 1350
NAVY, PAPER, YELLOW, MUTED, MINT = map(HexColor, ['#061a33', '#fbf5ea', '#f5dc69', '#b1bcc8', '#78d8c4'])
ARTICLE = 'https://www.trace-li.com/insights/the-award-was-signed-the-proof-was-not-ready'
CALL = 'https://cal.com/oqemal/30min'
SOURCES = [
    ('UN OIOS / Report 2024/064', 'https://oios.un.org/system/files/confidential-files/Reports/2024_064_pd.pdf'),
    ('UN OIOS / Implementation status, July 2026', 'https://oios.un.org/sites/default/files/2026-07/Rec_implementation_rate_IAD_20260731.pdf'),
    ('OLAF / Report 2025 / Irregular tender procedure', 'https://ec.europa.eu/olaf-report/2025/investigative-activities/protection-of-eu-funds_en.html#an-irregular-tender-procedure'),
    ('OLAF / Report 2023 / IPARD funding', 'https://ec.europa.eu/olaf-report/2023/investigative-activities/preventing-undue-expenditure_en.html#serious-misuse-of-eu-pre-accession-agricultural-funds'),
    ('World Bank / Debarment notice / 18 June 2025', 'https://www.worldbank.org/en/news/press-release/2025/06/18/world-bank-group-debars-pars-tableau-company-jsc'),
]

for name, file in [('Regular', 'IBMPlexSans-Regular.ttf'), ('Bold', 'IBMPlexSans-Bold.ttf'), ('Medium', 'IBMPlexSans-Medium.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(Path.home() / 'Library/Fonts' / file)))

OUT.mkdir(parents=True, exist_ok=True)
TMP.mkdir(parents=True, exist_ok=True)
PDF.parent.mkdir(parents=True, exist_ok=True)
c = canvas.Canvas(str(TMP / 'untagged.pdf'), pagesize=(W, H), pageCompression=1)
c.setTitle('The award was signed. The proof was not ready. | Traceli')
c.setAuthor('Traceli Research Desk')
c.setSubject('Four official records. Seven questions for one completed award.')
page_tags, tags, texts = [], [], []

def rect(x, top, width, height, color):
    c.setFillColor(color)
    c.rect(x, H-top-height, width, height, fill=1, stroke=0)

def line(top, color=MUTED, x=64, width=952):
    c.setStrokeColor(color)
    c.setLineWidth(1)
    c.line(x, H-top, x+width, H-top)

def text(value, x, top, size=36, font='Regular', color=PAPER, role='P'):
    width = pdfmetrics.stringWidth(value, font, size)
    assert x >= 0 and x + width <= W-50, (value, width, x, size)
    assert top >= 0 and top + size <= H-30, (value, top, size)
    mcid = len(tags)
    c._code.append(f'/{role} <</MCID {mcid}>> BDC')
    c.setFillColor(color)
    c.setFont(font, size)
    c.drawString(x, H-top-size, value)
    c._code.append('EMC')
    tags.append((role, value))
    texts.append(value)
    return width

def block(value, top, size=38, leading=None, x=64, width=952, color=PAPER, font='Regular'):
    leading = leading or size*1.28
    lines = []
    for paragraph in value.split('\n'):
        current = ''
        for word in paragraph.split():
            candidate = (current+' '+word).strip()
            if pdfmetrics.stringWidth(candidate, font, size) > width and current:
                lines.append(current)
                current = word
            else:
                current = candidate
        lines.append(current)
    for i, value in enumerate(lines):
        text(value, x, top+i*leading, size, font, color)
    return top + len(lines)*leading

def headline(lines, top, size=88, highlights=()):
    leading = size*1.02
    for i, value in enumerate(lines):
        width = pdfmetrics.stringWidth(value, 'Bold', size)
        if i in highlights:
            rect(58, top+i*leading+15, width+20, size*.95, YELLOW)
        text(value, 64, top+i*leading, size, 'Bold', NAVY if i in highlights else PAPER, 'H1' if not page_tags else 'H2')
    return top+len(lines)*leading

def start(index, label):
    global tags, texts
    tags, texts = [], []
    rect(0, 0, W, H, NAVY)
    # Traceli diamond and trace-node mark; yellow is editorial emphasis.
    c.saveState()
    c.translate(81, H-61)
    c.rotate(45)
    c.setFillColor(HexColor('#0d3953'))
    c.setStrokeColor(MINT)
    c.setLineWidth(1.3)
    c.roundRect(-21,-21,42,42,5,fill=1,stroke=1)
    c.setStrokeColor(HexColor('#638080'))
    c.roundRect(-14,-14,28,28,3,fill=0,stroke=1)
    c.restoreState()
    c.setStrokeColor(MINT)
    c.setLineWidth(2.2)
    p = c.beginPath()
    p.moveTo(65, H-65); p.lineTo(81, H-47); p.lineTo(98, H-63)
    c.drawPath(p)
    for x, top in [(65,65), (81,47), (98,63)]:
        c.setFillColor(MINT if x == 98 else PAPER)
        c.circle(x, H-top, 4, stroke=0, fill=1)
    text('TRACELI', 121, 37, 30, 'Bold')
    text(label, 630, 44, 20, 'Medium', MUTED)
    line(108, HexColor('#314156'))

def finish(index, hint='SWIPE TO CONTINUE  >'):
    line(1250, HexColor('#314156'))
    text('BEFORE YOU SIGN  /  01', 64, 1272, 20, 'Medium', MUTED)
    text(hint, 508, 1272, 18, 'Medium', MUTED)
    text(f'{index:02d} / 09', 914, 1272, 20, 'Medium', PAPER)
    page_tags.append({'tags': list(tags), 'text': '\n'.join(texts)})
    c.showPage()

def source(source_id, top=1180):
    name, url = SOURCES[source_id]
    text(name+'  >', 64, top, 23, 'Medium', MINT)
    c.linkURL(url, (64, H-top-33, 1016, H-top+3), relative=0)

start(1, 'RESEARCH DESK')
image_path = OUT/'source/editorial-paper-still-life.png'
c._code.append('/Figure <</MCID %d>> BDC' % len(tags))
c.saveState()
crop = c.beginPath()
crop.rect(0, H-665, W, 555)
c.clipPath(crop, stroke=0)
c.drawImage(str(image_path), 0, H-747, W, 720, mask='auto')
c.restoreState()
c._code.append('EMC')
tags.append(('Figure', 'AI-generated editorial illustration: blank sheets and a pen on a dark table. Not a case photograph or an evidence document.'))
text('EDITORIAL ILLUSTRATION', 64, 675, 18, 'Medium', MUTED)
headline(['THE AWARD', 'WAS SIGNED.', 'THE PROOF', 'WASN\'T READY.'], 722, 87, (2,3))
block('Four official records.\nSeven questions for one completed award.', 1111, 31, 42)
finish(1)

start(2, 'THE CONTROL MOMENT')
headline(['WHY DID', 'THIS SUPPLIER', 'WIN?'], 176, 103, (1,2))
block('The approval may be recorded. The reasoning may still sit across notes, documents and email.', 540, 42, 55)
items = [('01', 'Governing rule'), ('02', 'Supplier evidence'), ('03', 'Named human judgment'), ('04', 'Exceptions and dispositions'), ('05', 'Required approval')]
for i, (n, label) in enumerate(items):
    top = 766+i*73
    text(n, 64, top, 26, 'Medium', MINT)
    text(label, 129, top-7, 36, 'Medium')
    if i < 4: line(top+52, HexColor('#314156'), 129, 887)
text('Make the connections visible to the next reviewer.', 64, 1170, 31, 'Medium', PAPER)
finish(2)

start(3, 'RECORD 01 / AUDITABILITY')
text('FINAL INTERNAL-AUDIT REPORT', 64, 163, 24, 'Medium', MINT)
headline(['THE EVALUATIONS', 'WEREN\'T TIMELY.', 'OR WELL', 'DOCUMENTED.'], 249, 80, (2,3))
block('UN OIOS found that UNMISS bid evaluations were not timely and their documentation was inadequate.', 659, 41, 54)
line(904, HexColor('#314156'))
block('The recommendations were accepted and later recorded as implemented.', 944, 37, 48)
source(0, 1140)
source(1, 1183)
finish(3)

start(4, 'RECORD 02 / ELIGIBILITY')
text('OLAF / INVESTIGATIVE FINDING', 64, 163, 24, 'Medium', MINT)
text('€7.5M', 55, 225, 205, 'Bold', PAPER, 'H2')
headline(['FINANCIAL', 'IMPACT.'], 470, 100, (0,1))
block('OLAF found an EU agency tender irregular and considered the corresponding payments ineligible.', 748, 43, 57)
line(995, HexColor('#314156'))
block('Investigative finding and recommendations.\nNot a final judgment or completed recovery.', 1031, 31, 43, color=MUTED)
source(2, 1183)
finish(4)

start(5, 'RECORD 03 / FUTURE FUNDS')
text('OLAF / INVESTIGATIVE RECOMMENDATION', 64, 163, 24, 'Medium', MINT)
text('€112M', 55, 225, 195, 'Bold', PAPER, 'H2')
headline(['IN FUTURE', 'FUNDING.'], 470, 100, (1,))
block('OLAF recommended protecting future IPARD funding in Albania until remedial measures were in place.', 748, 43, 57)
line(995, HexColor('#314156'))
block('The source does not establish that this\namount was suspended or recovered.', 1031, 31, 43, color=MUTED)
source(3, 1183)
finish(5)

start(6, 'RECORD 04 / DEBARMENT')
text('WORLD BANK / SETTLEMENT-BASED DEBARMENT', 64, 163, 23, 'Medium', MINT)
text('63', 55, 215, 210, 'Bold', PAPER, 'H2')
headline(['MONTHS', 'DEBARRED.'], 470, 100, (1,))
block('Pars Tableau made false past-experience claims in bids for two World Bank-financed projects.', 748, 43, 57)
line(995, HexColor('#314156'))
block('The company acknowledged responsibility\nunder the settlement agreement.', 1031, 31, 43, color=MUTED)
source(4, 1183)
finish(6)

def question(n, label, value, top):
    text(f'{n:02d}', 64, top+2, 27, 'Bold', MINT)
    text(label.upper(), 137, top-2, 28, 'Bold')
    bottom = block(value, top+45, 34, 44, x=137, width=879)
    return bottom

start(7, 'THE FILE TEST / 1 OF 2')
headline(['START WITH', 'ONE AWARD.'], 172, 99, (1,))
question(1, 'Rule', 'Can each criterion open its governing rule?', 459)
question(2, 'Evidence', 'Can each material supplier claim open its source evidence?', 624)
question(3, 'Judgment', 'Is each consequential judgment tied to a named reviewer and timestamp?', 789)
question(4, 'Exceptions', 'Are clarifications, conflicts and exceptions visible with their dispositions?', 954)
text('Seven questions to locate gaps in the record.', 64, 1177, 29, 'Medium', MUTED)
finish(7)

start(8, 'THE FILE TEST / 2 OF 2')
headline(['CAN SOMEONE', 'FOLLOW THE', 'DECISION?'], 172, 89, (1,2))
question(5, 'Chronology', 'Does the record show what changed, who changed it and why?', 541)
question(6, 'Approval', 'Can the signatory see unresolved issues before approval?', 717)
question(7, 'Independent review', 'Can a reviewer export a coherent record without relying on personal memory?', 893)
block('A missing link does not by itself establish\nnon-compliance or misconduct.', 1135, 29, 38, color=MUTED)
finish(8)

start(9, 'WHERE TRACELI FITS')
headline(['MAKE THE', 'AWARD RECORD', 'REVIEWABLE.'], 174, 88, (2,))
block('Traceli supports procurement-evidence reconstruction and audit responses.', 501, 41, 54)
block('Bring the question, the file and the deadline.\nWe can discuss a scoped engagement.', 664, 38, 50)
rect(64, 844, 952, 102, YELLOW)
text('DISCUSS ONE PROCUREMENT FILE', 93, 866, 38, 'Bold', NAVY)
c.linkURL(CALL, (64,H-946,1016,H-844), relative=0)
text('Read the full article and primary sources  >', 64, 980, 31, 'Medium', MINT)
c.linkURL(ARTICLE, (64,H-1028,1016,H-974), relative=0)
block('These are public records, not Traceli customer stories or prevention claims. Traceli does not certify compliance, replace audit, make the award decision or guarantee outcomes.', 1067, 27, 36, color=MUTED)
finish(9, 'TRACE-LI.COM')
c.save()

# Tag each text run in the existing drawing order; the cover illustration has an alt.
writer = PdfWriter()
writer.clone_document_from_reader(PdfReader(TMP/'untagged.pdf'))
struct = D({N('/Type'):N('/StructTreeRoot')})
struct_ref = writer._add_object(struct)
doc = D({N('/Type'):N('/StructElem'), N('/S'):N('/Document'), N('/P'):struct_ref})
doc_ref = writer._add_object(doc)
sections, parent_nums = A(), A()
for i, (page, spec) in enumerate(zip(writer.pages, page_tags)):
    page[N('/StructParents')] = I(i)
    section = D({N('/Type'):N('/StructElem'), N('/S'):N('/Sect'), N('/P'):doc_ref, N('/Pg'):page.indirect_reference})
    section_ref = writer._add_object(section)
    children = A()
    for mcid, (role, value) in enumerate(spec['tags']):
        element = D({N('/Type'):N('/StructElem'), N('/S'):N('/'+role), N('/P'):section_ref,
                     N('/Pg'):page.indirect_reference, N('/K'):I(mcid)})
        if role == 'Figure': element[N('/Alt')] = T(value)
        children.append(writer._add_object(element))
    section[N('/K')] = children
    sections.append(section_ref)
    parent_nums.extend([I(i), children])
doc[N('/K')] = sections
struct[N('/K')] = A([doc_ref])
struct[N('/ParentTree')] = writer._add_object(D({N('/Nums'):parent_nums}))
struct[N('/ParentTreeNextKey')] = I(len(writer.pages))
writer.root_object[N('/StructTreeRoot')] = struct_ref
writer.root_object[N('/MarkInfo')] = D({N('/Marked'):B(True)})
writer.root_object[N('/Lang')] = T('en-GB')
with PDF.open('wb') as stream: writer.write(stream)

renderer = Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdftoppm'
subprocess.run([str(renderer), '-scale-to-x', str(W), '-scale-to-y', str(H), '-png', str(PDF), str(OUT/'slide')], check=True)
(OUT/'slide-copy.json').write_text(json.dumps(page_tags, indent=2)+'\n')
(OUT/'linkedin-post.txt').write_text('''The award was signed. Could someone outside your team show why this supplier won?

The approval may be recorded while the reasoning sits across evaluation notes, supplier documents, clarifications and email.

Four official records show why the detail matters: an audit finding, ineligible payments, a recommendation to protect future funding, and a settlement-based debarment. Each has a different procedural status.

Swipe for the records and seven questions to test one completed award.

A missing link does not by itself establish non-compliance or misconduct. These are public records, not Traceli customer stories or claims that Traceli would have prevented an outcome.

Read the full article and primary sources:
'''+ARTICLE+'\n')
check = PdfReader(PDF)
assert len(check.pages) == 9
assert all(page.extract_text().strip() for page in check.pages)
assert '/StructTreeRoot' in check.trailer['/Root']
assert sum(len(p.get('/Annots', [])) for p in check.pages) == 7
sha = hashlib.sha256(PDF.read_bytes()).hexdigest()
(OUT/'manifest.json').write_text(json.dumps({'version':'linkedin-editorial-v2','pdf':str(PDF.relative_to(ROOT)), 'sha256':sha,'pages':9,'size':[1080,1350],'source_links':SOURCES,'article':ARTICLE,'claim_basis':'Approved first-piece source sheet; presentation and wording adapted 9 September 2026.','image':'source/editorial-paper-still-life.png','image_provenance':'OpenAI built-in image generation; illustrative, not case evidence.','reference':'https://www.instagram.com/maybeworthbuilding/','reference_observation':'Public cover grid only; individual posts required login.'}, indent=2)+'\n')
print(f'Created {PDF}\n9 pages; 7 links; tagged text; SHA-256 {sha}')
