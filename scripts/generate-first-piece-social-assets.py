#!/usr/bin/env python3
"""Generate the review-stage social asset set for Before You Sign 01."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

RUNTIME_PYTHON_PACKAGES = Path(
    Path.home(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/python"
)
if RUNTIME_PYTHON_PACKAGES.exists():
    sys.path.insert(0, str(RUNTIME_PYTHON_PACKAGES))

from reportlab.lib.colors import Color, HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
RELEASE = os.environ.get("TRACELI_SOCIAL_RELEASE") == "1"
OUTPUT_PDF = ROOT / ("output/pdf/before-you-sign-01-linkedin-document.pdf" if RELEASE else "output/pdf/before-you-sign-01-linkedin-document-review.pdf")
OUTPUT_ROOT = ROOT / ("output/social/before-you-sign-01-release" if RELEASE else "output/social/before-you-sign-01")
LINKEDIN_DIR = OUTPUT_ROOT / "linkedin"
X_DIR = OUTPUT_ROOT / "x"
TMP_DIR = ROOT / "tmp/pdfs/before-you-sign-01"

PAGES = 7
LI_W, LI_H = 1080, 1350
X_W, X_H = 1600, 900

NAVY = HexColor("#061a33")
INK = HexColor("#071d39")
IVORY = HexColor("#fbf5ea")
PAPER = HexColor("#f7f3eb")
MINT = HexColor("#78d8c4")
MINT_DARK = HexColor("#1f6f61")
MINT_PALE = HexColor("#dff1eb")
BLUE_PALE = HexColor("#e9f1fb")
VIOLET_PALE = HexColor("#eeeafd")
AMBER = HexColor("#d19c3e")
AMBER_PALE = HexColor("#fff4d8")
RED_PALE = HexColor("#f9e6df")
WHITE = HexColor("#ffffff")
SLATE = HexColor("#526167")
MUTED = HexColor("#748087")
BORDER = HexColor("#d8d5cc")

SOURCE_OIOS = "https://oios.un.org/system/files/confidential-files/Reports/2024_064_pd.pdf"
SOURCE_OLAF_2025 = "https://ec.europa.eu/olaf-report/2025/investigative-activities/protection-of-eu-funds_en.html#an-irregular-tender-procedure"
SOURCE_OLAF_2023 = "https://ec.europa.eu/olaf-report/2023/investigative-activities/preventing-undue-expenditure_en.html#serious-misuse-of-eu-pre-accession-agricultural-funds"
SOURCE_WORLD_BANK = "https://www.worldbank.org/en/news/press-release/2025/06/18/world-bank-group-debars-pars-tableau-company-jsc"


def register_fonts() -> None:
    font_root = Path.home() / "Library/Fonts"
    font_paths = {
        "Plex": font_root / "IBMPlexSans-Regular.ttf",
        "PlexMedium": font_root / "IBMPlexSans-Medium.ttf",
        "PlexSemi": font_root / "IBMPlexSans-SemiBold.ttf",
        "PlexBold": font_root / "IBMPlexSans-Bold.ttf",
        "Display": Path("/System/Library/Fonts/Supplemental/Georgia.ttf"),
        "DisplayBold": Path("/System/Library/Fonts/Supplemental/Georgia Bold.ttf"),
        "Mono": Path("/System/Library/Fonts/SFNSMono.ttf"),
    }
    for name, path in font_paths.items():
        if not path.exists():
            raise FileNotFoundError(f"Required font not found: {path}")
        pdfmetrics.registerFont(TTFont(name, str(path)))


def alpha(color: Color, amount: float) -> Color:
    return Color(color.red, color.green, color.blue, alpha=amount)


def y_from_top(page_h: float, top: float) -> float:
    return page_h - top


def round_rect(c: canvas.Canvas, page_h: float, x: float, top: float, width: float, height: float, radius: float, fill: Color, stroke: Color | None = None, stroke_width: float = 1) -> None:
    c.saveState()
    c.setFillColor(fill)
    if stroke is None:
        c.setStrokeColor(fill)
    else:
        c.setStrokeColor(stroke)
    c.setLineWidth(stroke_width)
    c.roundRect(x, page_h - top - height, width, height, radius, fill=1, stroke=1 if stroke is not None else 0)
    c.restoreState()


def line(c: canvas.Canvas, page_h: float, x1: float, top1: float, x2: float, top2: float, color: Color, width: float = 2) -> None:
    c.saveState()
    c.setStrokeColor(color)
    c.setLineWidth(width)
    c.line(x1, page_h - top1, x2, page_h - top2)
    c.restoreState()


def circle(c: canvas.Canvas, page_h: float, cx: float, top_cy: float, radius: float, fill: Color, stroke: Color | None = None, stroke_width: float = 1) -> None:
    c.saveState()
    c.setFillColor(fill)
    c.setStrokeColor(stroke or fill)
    c.setLineWidth(stroke_width)
    c.circle(cx, page_h - top_cy, radius, fill=1, stroke=1 if stroke is not None else 0)
    c.restoreState()


def wrap_text(text: str, font: str, size: float, width: float) -> list[str]:
    lines: list[str] = []
    paragraphs = text.split("\n")
    for paragraph in paragraphs:
        if not paragraph:
            lines.append("")
            continue
        words = paragraph.split()
        current = words[0]
        for word in words[1:]:
            candidate = f"{current} {word}"
            if pdfmetrics.stringWidth(candidate, font, size) <= width:
                current = candidate
            else:
                lines.append(current)
                current = word
        lines.append(current)
    return lines


def text_block(c: canvas.Canvas, page_h: float, text: str, x: float, top: float, width: float, *, font: str = "Plex", size: float = 32, leading: float | None = None, color: Color = INK, max_lines: int | None = None, align: str = "left") -> float:
    leading = leading or size * 1.25
    lines = wrap_text(text, font, size, width)
    if max_lines is not None and len(lines) > max_lines:
        lines = lines[:max_lines]
        last = lines[-1]
        while pdfmetrics.stringWidth(f"{last}...", font, size) > width and len(last) > 1:
            last = last[:-1]
        lines[-1] = f"{last.rstrip()}..."
    c.saveState()
    c.setFillColor(color)
    c.setFont(font, size)
    baseline = page_h - top - size
    for value in lines:
        if align == "center":
            c.drawCentredString(x + width / 2, baseline, value)
        elif align == "right":
            c.drawRightString(x + width, baseline, value)
        else:
            c.drawString(x, baseline, value)
        baseline -= leading
    c.restoreState()
    return top + len(lines) * leading


def label(c: canvas.Canvas, page_h: float, text: str, x: float, top: float, *, color: Color = MINT_DARK, size: float = 18) -> None:
    c.saveState()
    c.setFillColor(color)
    c.setFont("Mono", size)
    c.drawString(x, page_h - top - size, text.upper())
    c.restoreState()


def draw_brand(c: canvas.Canvas, page_h: float, x: float, top: float, *, light: bool = True, scale: float = 1) -> None:
    size = 48 * scale
    center_x = x + size / 2
    center_y_top = top + size / 2
    c.saveState()
    c.translate(center_x, page_h - center_y_top)
    c.rotate(45)
    c.setFillColor(HexColor("#0d3953"))
    c.setStrokeColor(alpha(MINT, 0.75))
    c.setLineWidth(1.3 * scale)
    c.roundRect(-size * 0.34, -size * 0.34, size * 0.68, size * 0.68, 7 * scale, fill=1, stroke=1)
    c.setFillColor(HexColor("#0d3953"))
    c.setStrokeColor(alpha(WHITE, 0.28))
    c.roundRect(-size * 0.23, -size * 0.23, size * 0.46, size * 0.46, 4 * scale, fill=0, stroke=1)
    c.restoreState()
    path_color = IVORY if light else WHITE
    line(c, page_h, x + 16 * scale, top + 29 * scale, x + 25 * scale, top + 18 * scale, path_color, 1.5 * scale)
    line(c, page_h, x + 25 * scale, top + 18 * scale, x + 34 * scale, top + 27 * scale, path_color, 1.5 * scale)
    circle(c, page_h, x + 16 * scale, top + 29 * scale, 2.4 * scale, path_color)
    circle(c, page_h, x + 25 * scale, top + 18 * scale, 2.4 * scale, path_color)
    circle(c, page_h, x + 34 * scale, top + 27 * scale, 2.8 * scale, MINT)
    c.saveState()
    c.setFillColor(IVORY if light else INK)
    c.setFont("PlexSemi", 20 * scale)
    c.drawString(x + 64 * scale, page_h - top - 33 * scale, "T R A C E L I")
    c.restoreState()


def draw_draft(c: canvas.Canvas, page_h: float, page_w: float, *, light: bool = False) -> None:
    if RELEASE:
        return
    width = 300
    height = 38
    left = page_w - width - 64
    top = 52
    fill = alpha(WHITE, 0.08) if light else AMBER_PALE
    stroke = alpha(WHITE, 0.18) if light else alpha(AMBER, 0.58)
    color = IVORY if light else HexColor("#7a5b18")
    round_rect(c, page_h, left, top, width, height, 13, fill, stroke)
    text_block(c, page_h, "INTERNAL REVIEW - NOT APPROVED", left + 14, top + 7, width - 28, font="Mono", size=11, leading=13, color=color, align="center")


def draw_page_number(c: canvas.Canvas, page_h: float, page_w: float, page_number: int, total_pages: int, *, light: bool = False) -> None:
    color = alpha(WHITE, 0.46) if light else MUTED
    line(c, page_h, 64, page_h - 80, page_w - 64, page_h - 80, alpha(WHITE, 0.13) if light else BORDER, 1)
    label(c, page_h, "Before You Sign 01", 64, page_h - 62, color=color, size=11)
    text_block(c, page_h, f"{page_number:02d} / {total_pages:02d}", page_w - 150, page_h - 65, 86, font="Mono", size=11, leading=13, color=color, align="right")


def draw_grid(c: canvas.Canvas, page_w: float, page_h: float, *, light: bool = True, spacing: int = 54) -> None:
    color = alpha(WHITE, 0.045) if light else alpha(INK, 0.045)
    c.saveState()
    c.setFillColor(color)
    for x in range(40, int(page_w), spacing):
        for top in range(40, int(page_h), spacing):
            c.circle(x, page_h - top, 1.2, fill=1, stroke=0)
    c.restoreState()


def draw_trace(c: canvas.Canvas, page_h: float, left: float, top: float, width: float, labels: list[str], *, on_dark: bool = False, highlight_human: bool = True) -> None:
    base = alpha(WHITE, 0.24) if on_dark else HexColor("#b9c9c5")
    node_fill = HexColor("#0b2a43") if on_dark else WHITE
    node_text = IVORY if on_dark else INK
    gap = width / (len(labels) - 1)
    centers = [(left + gap * index, top) for index in range(len(labels))]
    for index in range(len(centers) - 1):
        x1, y1 = centers[index]
        x2, y2 = centers[index + 1]
        line(c, page_h, x1 + 36, y1, x2 - 36, y2, base, 5)
        circle(c, page_h, (x1 + x2) / 2, y1, 4, MINT if index != 2 else AMBER)
    for index, ((cx, cy), item) in enumerate(zip(centers, labels, strict=True)):
        radius = 48 if highlight_human and index == 2 else 38
        fill = MINT_PALE if highlight_human and index == 2 and not on_dark else node_fill
        stroke = MINT if index != 3 else AMBER
        circle(c, page_h, cx, cy, radius, fill, stroke, 3)
        text_block(c, page_h, f"{index + 1:02d}", cx - 22, cy - 13, 44, font="Mono", size=13, leading=14, color=MINT_DARK if not on_dark else MINT, align="center")
        text_block(c, page_h, item, cx - 90, cy + 66, 180, font="PlexSemi", size=16, leading=20, color=node_text, align="center")


def source_line(c: canvas.Canvas, page_h: float, text: str, x: float, top: float, width: float, url: str) -> float:
    bottom_top = text_block(c, page_h, text, x, top, width, font="Mono", size=11, leading=15, color=MUTED)
    c.linkURL(url, (x, page_h - bottom_top, x + width, page_h - top + 4), relative=0)
    return bottom_top


def card(c: canvas.Canvas, page_h: float, x: float, top: float, width: float, height: float, *, fill: Color = WHITE, stroke: Color = BORDER) -> None:
    round_rect(c, page_h, x, top, width, height, 26, fill, stroke, 1.5)


def draw_linkedin_cover(c: canvas.Canvas) -> None:
    c.setFillColor(NAVY)
    c.rect(0, 0, LI_W, LI_H, fill=1, stroke=0)
    draw_grid(c, LI_W, LI_H, light=True)
    draw_brand(c, LI_H, 64, 54, light=True)
    draw_draft(c, LI_H, LI_W, light=True)
    label(c, LI_H, "Before You Sign - Research Note 01", 64, 188, color=MINT, size=15)
    text_block(c, LI_H, "The award was signed. The proof was not ready.", 64, 232, 900, font="Display", size=76, leading=84, color=IVORY)
    text_block(c, LI_H, "Four official records. One award-assurance question.", 64, 590, 760, font="Plex", size=31, leading=42, color=alpha(WHITE, 0.68))
    draw_trace(c, LI_H, 130, 890, 820, ["Governing rule", "Source evidence", "Human judgment", "Exception", "Approval"], on_dark=True)
    text_block(c, LI_H, "Traceli Research Desk", 64, 1160, 500, font="PlexSemi", size=21, leading=26, color=MINT)
    draw_page_number(c, LI_H, LI_W, 1, PAGES, light=True)


def draw_linkedin_control(c: canvas.Canvas) -> None:
    c.setFillColor(PAPER)
    c.rect(0, 0, LI_W, LI_H, fill=1, stroke=0)
    draw_grid(c, LI_W, LI_H, light=False)
    draw_brand(c, LI_H, 64, 54, light=False)
    draw_draft(c, LI_H, LI_W)
    label(c, LI_H, "The control moment", 64, 184)
    text_block(c, LI_H, "A donor or auditor asks: why did this supplier win?", 64, 224, 900, font="Display", size=58, leading=68, color=INK)
    text_block(c, LI_H, "The answer may exist across valid systems and files. The control problem is whether another person can follow it without reconstructing the decision from memory.", 64, 400, 880, font="Plex", size=25, leading=36, color=SLATE)
    card(c, LI_H, 64, 610, 952, 390, fill=WHITE)
    draw_trace(c, LI_H, 135, 760, 810, ["Governing rule", "Source evidence", "Human judgment", "Exception", "Approval"], on_dark=False)
    round_rect(c, LI_H, 282, 1036, 516, 74, 18, MINT_PALE, alpha(MINT_DARK, 0.22))
    text_block(c, LI_H, "The named human decision point remains visible.", 312, 1054, 456, font="PlexSemi", size=20, leading=25, color=MINT_DARK, align="center")
    text_block(c, LI_H, "Traceli does not show an automatic source-to-award path.", 64, 1145, 780, font="Plex", size=18, leading=25, color=MUTED)
    draw_page_number(c, LI_H, LI_W, 2, PAGES)


def draw_case_card(c: canvas.Canvas, *, x: float, top: float, width: float, height: float, family: str, institution: str, status: str, metric: str, finding: str, followup: str, question: str, tint: Color) -> None:
    card(c, LI_H, x, top, width, height, fill=WHITE)
    round_rect(c, LI_H, x + 24, top + 24, width - 48, 46, 14, tint)
    label(c, LI_H, family, x + 40, top + 38, color=INK, size=12)
    text_block(c, LI_H, institution, x + 32, top + 102, width - 64, font="PlexSemi", size=20, leading=26, color=INK)
    text_block(c, LI_H, status, x + 32, top + 144, width - 64, font="Mono", size=11, leading=16, color=MUTED)
    if metric:
        text_block(c, LI_H, metric, x + 32, top + 205, width - 64, font="Display", size=58, leading=64, color=INK)
        finding_top = top + 292
    else:
        finding_top = top + 214
    next_top = text_block(c, LI_H, finding, x + 32, finding_top, width - 64, font="PlexMedium", size=22, leading=30, color=SLATE)
    if followup:
        next_top = text_block(c, LI_H, followup, x + 32, next_top + 20, width - 64, font="Plex", size=16, leading=23, color=MUTED)
    round_rect(c, LI_H, x + 24, top + height - 174, width - 48, 142, 18, PAPER, BORDER)
    label(c, LI_H, "Control question", x + 40, top + height - 150, color=MINT_DARK, size=11)
    text_block(c, LI_H, question, x + 40, top + height - 116, width - 80, font="PlexSemi", size=17, leading=23, color=INK)


def draw_linkedin_cases_one(c: canvas.Canvas) -> None:
    c.setFillColor(PAPER)
    c.rect(0, 0, LI_W, LI_H, fill=1, stroke=0)
    draw_brand(c, LI_H, 64, 54, light=False)
    draw_draft(c, LI_H, LI_W)
    label(c, LI_H, "Two distinct consequence families", 64, 178)
    text_block(c, LI_H, "Auditability and financial eligibility", 64, 218, 900, font="Display", size=52, leading=60, color=INK)
    draw_case_card(
        c, x=64, top=338, width=458, height=790, family="Auditability", institution="UN OIOS - UNMISS", status="FINAL INTERNAL-AUDIT REPORT", metric="", finding="Bid evaluations were not timely and their documentation was inadequate.", followup="Recommendations were accepted and later recorded as implemented.", question="Can each material evaluation claim open its source, reviewer and timestamp?", tint=MINT_PALE,
    )
    draw_case_card(
        c, x=558, top=338, width=458, height=790, family="Financial eligibility", institution="European Anti-Fraud Office", status="INVESTIGATIVE FINDING AND RECOMMENDATIONS", metric="€7.5m", finding="Financial impact; corresponding payments considered ineligible.", followup="Not presented as a final judgment or completed recovery.", question="Are competition, evaluation and approval controls evidenced before commitment?", tint=BLUE_PALE,
    )
    source_line(c, LI_H, "Source: UN OIOS - Report 2024/064", 64, 1160, 430, SOURCE_OIOS)
    source_line(c, LI_H, "Source: OLAF Report 2025", 558, 1160, 458, SOURCE_OLAF_2025)
    draw_page_number(c, LI_H, LI_W, 3, PAGES)


def draw_linkedin_cases_two(c: canvas.Canvas) -> None:
    c.setFillColor(PAPER)
    c.rect(0, 0, LI_W, LI_H, fill=1, stroke=0)
    draw_brand(c, LI_H, 64, 54, light=False)
    draw_draft(c, LI_H, LI_W)
    label(c, LI_H, "Two distinct consequence families", 64, 178)
    text_block(c, LI_H, "Funding continuity and integrity exposure", 64, 218, 900, font="Display", size=52, leading=60, color=INK)
    draw_case_card(
        c, x=64, top=350, width=458, height=778, family="Funding continuity", institution="European Anti-Fraud Office", status="INVESTIGATIVE FINDINGS AND RECOMMENDATIONS", metric="€112m", finding="OLAF recommended protecting future IPARD funding until remedial measures were in place.", followup="The source does not establish that the amount was suspended or recovered.", question="Are competition, pricing and supplier-evidence anomalies visible before sign-off?", tint=AMBER_PALE,
    )
    draw_case_card(
        c, x=558, top=350, width=458, height=778, family="Integrity exposure", institution="World Bank Group", status="DEBARMENT UNDER A SETTLEMENT AGREEMENT", metric="63 months", finding="Debarment after false past-experience claims in two financed-project bids.", followup="The company acknowledged responsibility under the settlement.", question="Is each material supplier claim linked to verifiable evidence and reviewer disposition?", tint=VIOLET_PALE,
    )
    source_line(c, LI_H, "Source: OLAF Report 2023", 64, 1160, 430, SOURCE_OLAF_2023)
    source_line(c, LI_H, "Source: World Bank Group - 18 June 2025", 558, 1160, 458, SOURCE_WORLD_BANK)
    draw_page_number(c, LI_H, LI_W, 4, PAGES)


def draw_linkedin_question(c: canvas.Canvas) -> None:
    c.setFillColor(NAVY)
    c.rect(0, 0, LI_W, LI_H, fill=1, stroke=0)
    draw_grid(c, LI_W, LI_H, light=True)
    draw_brand(c, LI_H, 64, 54, light=True)
    draw_draft(c, LI_H, LI_W, light=True)
    label(c, LI_H, "The recurring control question", 64, 188, color=MINT)
    text_block(c, LI_H, "Could the accountable team prove the award before signing it?", 64, 242, 910, font="Display", size=68, leading=78, color=IVORY)
    line(c, LI_H, 540, 554, 540, 704, alpha(WHITE, 0.22), 4)
    circle(c, LI_H, 540, 632, 54, MINT_PALE, MINT, 4)
    text_block(c, LI_H, "AWARD\nPROOF", 492, 602, 96, font="Mono", size=13, leading=18, color=MINT_DARK, align="center")
    consequences = [
        (88, 748, "01", "Auditability", "Incomplete or hard-to-test record"),
        (548, 748, "02", "Financial eligibility", "Payments considered ineligible"),
        (88, 936, "03", "Funding continuity", "Recommendation linked future funds to remediation"),
        (548, 936, "04", "Integrity exposure", "Settlement-based debarment"),
    ]
    for x, top, number, title, detail in consequences:
        round_rect(c, LI_H, x, top, 444, 150, 22, alpha(WHITE, 0.06), alpha(WHITE, 0.13))
        text_block(c, LI_H, number, x + 22, top + 22, 52, font="Mono", size=13, leading=16, color=MINT)
        text_block(c, LI_H, title, x + 82, top + 20, 330, font="PlexSemi", size=20, leading=25, color=IVORY)
        text_block(c, LI_H, detail, x + 82, top + 58, 330, font="Plex", size=15, leading=21, color=alpha(WHITE, 0.58))
    round_rect(c, LI_H, 88, 1124, 904, 82, 18, alpha(AMBER, 0.10), alpha(AMBER, 0.36))
    text_block(c, LI_H, "Four records show consequence categories - not prevalence, customer outcomes or prevention claims.", 116, 1144, 848, font="PlexMedium", size=17, leading=23, color=IVORY, align="center")
    draw_page_number(c, LI_H, LI_W, 5, PAGES, light=True)


def draw_linkedin_checklist(c: canvas.Canvas) -> None:
    c.setFillColor(PAPER)
    c.rect(0, 0, LI_W, LI_H, fill=1, stroke=0)
    draw_brand(c, LI_H, 64, 54, light=False)
    draw_draft(c, LI_H, LI_W)
    label(c, LI_H, "Seven questions", 64, 178)
    text_block(c, LI_H, "Test one completed award.", 64, 218, 900, font="Display", size=60, leading=68, color=INK)
    questions = [
        "Can each criterion open its governing rule?",
        "Can each material supplier claim open its source evidence?",
        "Is each consequential judgment tied to a named reviewer and timestamp?",
        "Are clarifications, conflicts and exceptions visible with their dispositions?",
        "Does the chronology show what changed, who changed it and why?",
        "Can the signatory see unresolved issues before approval?",
        "Can an independent reviewer export a coherent record without relying on personal memory?",
    ]
    top = 340
    for index, question in enumerate(questions, start=1):
        height = 82 if index in {1, 2, 6} else 94
        card(c, LI_H, 64, top, 952, height, fill=WHITE)
        circle(c, LI_H, 112, top + height / 2, 24, MINT_PALE, MINT, 2)
        text_block(c, LI_H, f"{index:02d}", 88, top + height / 2 - 10, 48, font="Mono", size=12, leading=14, color=MINT_DARK, align="center")
        text_block(c, LI_H, question, 158, top + 19, 812, font="PlexSemi", size=19, leading=25, color=INK)
        top += height + 12
    round_rect(c, LI_H, 64, 1075, 952, 84, 18, MINT_PALE, alpha(MINT_DARK, 0.18))
    text_block(c, LI_H, "A weak answer is not proof of misconduct. It is a signal that the award record may not yet be ready.", 94, 1101, 892, font="PlexMedium", size=16, leading=22, color=INK, align="center")
    draw_page_number(c, LI_H, LI_W, 6, PAGES)


def draw_linkedin_fit(c: canvas.Canvas) -> None:
    c.setFillColor(PAPER)
    c.rect(0, 0, LI_W, LI_H, fill=1, stroke=0)
    draw_brand(c, LI_H, 64, 54, light=False)
    draw_draft(c, LI_H, LI_W)
    label(c, LI_H, "Where Traceli fits", 64, 178)
    text_block(c, LI_H, "Be ready to explain the award.", 64, 218, 900, font="Display", size=58, leading=66, color=INK)
    steps = [
        ("01", "Map the award controls", "Connect the governing rules and approved evaluation method."),
        ("02", "Surface the evidence gaps", "Keep unresolved proof visible for named human disposition."),
        ("03", "Prepare a source-linked file", "Preserve the source-linked rule, evidence, judgment, exception, approval and chronology."),
    ]
    top = 384
    for index, (number, title, detail) in enumerate(steps):
        fill = [MINT_PALE, BLUE_PALE, VIOLET_PALE][index]
        round_rect(c, LI_H, 64, top, 952, 170, 24, WHITE, BORDER)
        round_rect(c, LI_H, 88, top + 28, 90, 90, 22, fill)
        text_block(c, LI_H, number, 105, top + 53, 56, font="Mono", size=17, leading=20, color=INK, align="center")
        text_block(c, LI_H, title, 214, top + 30, 730, font="PlexSemi", size=26, leading=32, color=INK)
        text_block(c, LI_H, detail, 214, top + 76, 730, font="Plex", size=18, leading=25, color=SLATE)
        top += 192
    round_rect(c, LI_H, 64, 974, 952, 112, 20, AMBER_PALE, alpha(AMBER, 0.44))
    text_block(c, LI_H, "Traceli does not certify compliance, replace audit, make the award decision or guarantee an outcome.", 94, 1004, 892, font="PlexMedium", size=19, leading=27, color=INK, align="center")
    round_rect(c, LI_H, 64, 1118, 610, 88, 20, NAVY)
    text_block(c, LI_H, "Discuss one procurement file", 94, 1146, 550, font="PlexSemi", size=24, leading=30, color=IVORY)
    text_block(c, LI_H, "cal.com/oqemal/30min", 704, 1148, 312, font="Mono", size=14, leading=18, color=MINT_DARK, align="right")
    c.linkURL("https://cal.com/oqemal/30min", (704, LI_H - 1190, 1016, LI_H - 1138), relative=0)
    draw_page_number(c, LI_H, LI_W, 7, PAGES)


def build_linkedin_pdf() -> None:
    OUTPUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT_PDF), pagesize=(LI_W, LI_H), pageCompression=1)
    c.setTitle("The award was signed. The proof was not ready. - Review copy")
    c.setAuthor("Traceli Research Desk")
    c.setSubject(("Before You Sign 01 - LinkedIn document" if RELEASE else "Before You Sign 01 - LinkedIn document - internal review copy"))
    c.setCreator("Traceli deterministic social asset generator")
    drawers = [
        draw_linkedin_cover,
        draw_linkedin_control,
        draw_linkedin_cases_one,
        draw_linkedin_cases_two,
        draw_linkedin_question,
        draw_linkedin_checklist,
        draw_linkedin_fit,
    ]
    for drawer in drawers:
        drawer(c)
        c.showPage()
    c.save()


def x_base(c: canvas.Canvas, *, dark: bool, number: int) -> None:
    background = NAVY if dark else PAPER
    c.setFillColor(background)
    c.rect(0, 0, X_W, X_H, fill=1, stroke=0)
    draw_grid(c, X_W, X_H, light=dark, spacing=64)
    draw_brand(c, X_H, 68, 50, light=dark, scale=1.05)
    draw_draft(c, X_H, X_W, light=dark)
    footer_color = alpha(WHITE, 0.45) if dark else MUTED
    line(c, X_H, 68, 824, X_W - 68, 824, alpha(WHITE, 0.12) if dark else BORDER, 1)
    label(c, X_H, "Before You Sign 01", 68, 842, color=footer_color, size=11)
    text_block(c, X_H, f"THREAD {number:02d} / 06", X_W - 250, 841, 182, font="Mono", size=11, leading=14, color=footer_color, align="right")


def x_case(c: canvas.Canvas, *, number: int, family: str, institution: str, status: str, metric: str, finding: str, boundary: str, question: str, tint: Color) -> None:
    x_base(c, dark=False, number=number)
    label(c, X_H, family, 68, 164, color=MINT_DARK, size=16)
    text_block(c, X_H, metric, 68, 208, 520, font="Display", size=86, leading=94, color=INK)
    text_block(c, X_H, institution, 68, 336, 510, font="PlexSemi", size=25, leading=31, color=INK)
    text_block(c, X_H, status, 68, 392, 520, font="Mono", size=12, leading=18, color=MUTED)
    round_rect(c, X_H, 624, 166, 908, 500, 30, WHITE, BORDER, 1.5)
    round_rect(c, X_H, 658, 202, 230, 44, 13, tint)
    label(c, X_H, "Official record", 684, 216, color=INK, size=11)
    next_top = text_block(c, X_H, finding, 658, 286, 808, font="PlexMedium", size=31, leading=41, color=INK)
    text_block(c, X_H, boundary, 658, next_top + 28, 808, font="Plex", size=21, leading=30, color=SLATE)
    round_rect(c, X_H, 68, 700, 1464, 90, 22, MINT_PALE, alpha(MINT_DARK, 0.18))
    label(c, X_H, "Control question", 96, 722, color=MINT_DARK, size=11)
    text_block(c, X_H, question, 278, 715, 1208, font="PlexSemi", size=20, leading=28, color=INK)
    text_block(c, X_H, "Public institutional record - not a Traceli customer story or prevention claim.", 658, 626, 808, font="Mono", size=10, leading=14, color=MUTED)


def build_x_review_pdf(path: Path) -> None:
    c = canvas.Canvas(str(path), pagesize=(X_W, X_H), pageCompression=1)
    c.setTitle("Before You Sign 01 - X thread image set - review copy")
    c.setAuthor("Traceli Research Desk")
    x_base(c, dark=True, number=1)
    label(c, X_H, "Four official records - one control question", 68, 178, color=MINT, size=15)
    text_block(c, X_H, "The award was signed. The proof was not ready.", 68, 230, 1100, font="Display", size=74, leading=82, color=IVORY)
    text_block(c, X_H, "Could the accountable team prove why the supplier won without reconstructing the decision from memory?", 68, 520, 1050, font="Plex", size=29, leading=41, color=alpha(WHITE, 0.68))
    draw_trace(c, X_H, 930, 656, 520, ["Rule", "Evidence", "Human", "Exception", "Approval"], on_dark=True)
    c.showPage()
    x_case(c, number=2, family="Auditability", institution="UN OIOS - UNMISS", status="FINAL INTERNAL-AUDIT REPORT", metric="Record gap", finding="Bid evaluations were not timely and their documentation was inadequate.", boundary="Recommendations were accepted and later recorded as implemented.", question="Can each material evaluation claim open its source, reviewer and timestamp?", tint=MINT_PALE)
    source_line(c, X_H, "Source: UN OIOS - Report 2024/064", 68, 795, 620, SOURCE_OIOS)
    c.showPage()
    x_case(c, number=3, family="Financial eligibility", institution="European Anti-Fraud Office", status="INVESTIGATIVE FINDING AND RECOMMENDATIONS", metric="€7.5m", finding="OLAF stated the financial impact and considered the corresponding payments ineligible.", boundary="Not presented as a final judgment or completed recovery.", question="Are competition, evaluation and approval controls evidenced before commitment?", tint=BLUE_PALE)
    source_line(c, X_H, "Source: OLAF Report 2025 - irregular tender procedure", 68, 795, 680, SOURCE_OLAF_2025)
    c.showPage()
    x_case(c, number=4, family="Funding continuity", institution="European Anti-Fraud Office", status="INVESTIGATIVE FINDINGS AND RECOMMENDATIONS", metric="€112m", finding="OLAF recommended protecting future IPARD funding until remedial measures were in place.", boundary="The source does not establish that the amount was suspended or recovered.", question="Are competition, pricing and supplier-evidence anomalies visible before sign-off?", tint=AMBER_PALE)
    source_line(c, X_H, "Source: OLAF Report 2023 - IPARD funds", 68, 795, 620, SOURCE_OLAF_2023)
    c.showPage()
    x_case(c, number=5, family="Integrity exposure", institution="World Bank Group", status="DEBARMENT UNDER A SETTLEMENT AGREEMENT", metric="63 months", finding="Debarment followed false past-experience claims in two financed-project bids.", boundary="The company acknowledged responsibility under the settlement agreement.", question="Is each material supplier claim linked to verifiable evidence and reviewer disposition?", tint=VIOLET_PALE)
    source_line(c, X_H, "Source: World Bank Group - 18 June 2025", 68, 795, 620, SOURCE_WORLD_BANK)
    c.showPage()
    x_base(c, dark=True, number=6)
    label(c, X_H, "Four records - four procedural outcomes", 68, 178, color=MINT, size=15)
    text_block(c, X_H, "One control question.", 68, 232, 900, font="Display", size=78, leading=86, color=IVORY)
    text_block(c, X_H, "Could the accountable team prove the award before signing it?", 68, 354, 1040, font="PlexSemi", size=38, leading=49, color=IVORY)
    consequences = [
        ("Auditability", "Record could not stand alone"),
        ("Financial eligibility", "Payments considered ineligible"),
        ("Funding continuity", "Recommendation tied funds to remediation"),
        ("Integrity exposure", "Settlement-based debarment"),
    ]
    for index, (item, detail) in enumerate(consequences):
        x = 68 + index * 372
        round_rect(c, X_H, x, 554, 340, 112, 22, alpha(WHITE, 0.06), alpha(WHITE, 0.14))
        text_block(c, X_H, f"{index + 1:02d}", x + 24, 578, 46, font="Mono", size=12, leading=14, color=MINT)
        text_block(c, X_H, item, x + 82, 568, 226, font="PlexSemi", size=18, leading=24, color=IVORY)
        text_block(c, X_H, detail, x + 82, 608, 226, font="Plex", size=13, leading=17, color=alpha(WHITE, 0.52))
    round_rect(c, X_H, 68, 706, 1464, 82, 20, alpha(AMBER, 0.10), alpha(AMBER, 0.36))
    text_block(c, X_H, "These are not Traceli customer stories and do not show that Traceli would have prevented an event.", 96, 730, 1408, font="PlexMedium", size=18, leading=24, color=IVORY, align="center")
    c.showPage()
    c.save()


def render_pdf_pages(pdf_path: Path, output_dir: Path, names: list[str]) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    prefix = TMP_DIR / pdf_path.stem
    pdftoppm = shutil.which("pdftoppm") or str(
        Path.home()
        / ".cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdftoppm"
    )
    subprocess.run([pdftoppm, "-png", "-r", "72", str(pdf_path), str(prefix)], check=True)
    rendered = sorted(TMP_DIR.glob(f"{pdf_path.stem}-*.png"), key=lambda item: int(item.stem.rsplit("-", 1)[1]))
    if len(rendered) != len(names):
        raise RuntimeError(f"Expected {len(names)} rendered pages from {pdf_path}, found {len(rendered)}")
    for source, name in zip(rendered, names, strict=True):
        target = output_dir / name
        if target.exists():
            target.unlink()
        shutil.move(str(source), str(target))


def main() -> None:
    register_fonts()
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    build_linkedin_pdf()
    x_pdf = TMP_DIR / "before-you-sign-01-x-review.pdf"
    build_x_review_pdf(x_pdf)
    render_pdf_pages(
        OUTPUT_PDF,
        LINKEDIN_DIR,
        [
            "01-cover.png",
            "02-control-moment.png",
            "03-auditability-financial-eligibility.png",
            "04-funding-continuity-integrity-exposure.png",
            "05-recurring-question.png",
            "06-seven-questions.png",
            "07-where-traceli-fits.png",
        ],
    )
    render_pdf_pages(
        x_pdf,
        X_DIR,
        [
            "01-thread-cover.png",
            "02-auditability.png",
            "03-financial-eligibility.png",
            "04-funding-continuity.png",
            "05-integrity-exposure.png",
            "06-control-question.png",
        ],
    )
    x_pdf.unlink(missing_ok=True)
    node = shutil.which("node") or str(
        Path.home()
        / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
    )
    subprocess.run([node, str(ROOT / "scripts/build-tagged-social-pdf.mjs")], check=True)
    subprocess.run([sys.executable, str(ROOT / "scripts/add-social-pdf-links.py")], check=True)
    print(f"Created {OUTPUT_PDF}")
    print(f"Created {len(list(LINKEDIN_DIR.glob('*.png')))} LinkedIn PNGs in {LINKEDIN_DIR}")
    print(f"Created {len(list(X_DIR.glob('*.png')))} X PNGs in {X_DIR}")


if __name__ == "__main__":
    main()
