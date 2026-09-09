#!/usr/bin/env python3
"""Add official-source link annotations without removing the tagged structure tree."""

from __future__ import annotations

import sys
import os
from pathlib import Path

RUNTIME_PYTHON_PACKAGES = Path(
    Path.home(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/python"
)
if RUNTIME_PYTHON_PACKAGES.exists():
    sys.path.insert(0, str(RUNTIME_PYTHON_PACKAGES))

from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject


ROOT = Path(__file__).resolve().parents[1]
RELEASE = os.environ.get("TRACELI_SOCIAL_RELEASE") == "1"
PDF_PATH = ROOT / ("output/pdf/before-you-sign-01-linkedin-document.pdf" if RELEASE else "output/pdf/before-you-sign-01-linkedin-document-review.pdf")

PAGE_SOURCE_WIDTH = 1080
PAGE_SOURCE_HEIGHT = 1350

LINKS = {
    2: [
        ("https://oios.un.org/system/files/confidential-files/Reports/2024_064_pd.pdf", 64, 1152, 430, 38),
        ("https://ec.europa.eu/olaf-report/2025/investigative-activities/protection-of-eu-funds_en.html#an-irregular-tender-procedure", 558, 1152, 458, 38),
    ],
    3: [
        ("https://ec.europa.eu/olaf-report/2023/investigative-activities/preventing-undue-expenditure_en.html#serious-misuse-of-eu-pre-accession-agricultural-funds", 64, 1152, 430, 38),
        ("https://www.worldbank.org/en/news/press-release/2025/06/18/world-bank-group-debars-pars-tableau-company-jsc", 558, 1152, 458, 38),
    ],
    6: [
        ("https://cal.com/oqemal/30min", 64, 1110, 952, 102),
    ],
}


def source_rect(page_width: float, page_height: float, left: float, top: float, width: float, height: float) -> RectangleObject:
    x_scale = page_width / PAGE_SOURCE_WIDTH
    y_scale = page_height / PAGE_SOURCE_HEIGHT
    x1 = left * x_scale
    x2 = (left + width) * x_scale
    y1 = page_height - (top + height) * y_scale
    y2 = page_height - top * y_scale
    return RectangleObject((x1, y1, x2, y2))


def main() -> None:
    reader = PdfReader(str(PDF_PATH))
    if reader.trailer["/Root"].get("/StructTreeRoot") is None:
        raise RuntimeError("Refusing to add links: tagged structure tree is missing")

    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    writer.add_metadata({
        "/Title": "The award was signed. The proof was not ready. - Review copy",
        "/Author": "Traceli Research Desk",
        "/Subject": ("Before You Sign 01 - LinkedIn document" if RELEASE else "Before You Sign 01 - LinkedIn document - internal review copy"),
    })

    for page_index, links in LINKS.items():
        page = writer.pages[page_index]
        page_width = float(page.mediabox.width)
        page_height = float(page.mediabox.height)
        for uri, left, top, width, height in links:
            writer.add_uri(
                page_number=page_index,
                uri=uri,
                rect=source_rect(page_width, page_height, left, top, width, height),
                border=[0, 0, 0],
            )

    temporary_path = PDF_PATH.with_suffix(".linked.tmp.pdf")
    with temporary_path.open("wb") as output:
        writer.write(output)
    temporary_path.replace(PDF_PATH)
    print(f"Added {sum(len(value) for value in LINKS.values())} PDF links: {PDF_PATH}")


if __name__ == "__main__":
    main()
