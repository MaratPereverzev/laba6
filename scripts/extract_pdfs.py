import os
from pathlib import Path
from PyPDF2 import PdfReader

SRC_DIR = Path(__file__).resolve().parents[1] / "Описание проекта"
OUT_DIR = Path(__file__).resolve().parents[1] / "data" / "pdf_texts"
OUT_DIR.mkdir(parents=True, exist_ok=True)

for pdf in SRC_DIR.glob('*.pdf'):
    try:
        reader = PdfReader(str(pdf))
        text = []
        for p in reader.pages:
            text.append(p.extract_text() or '')
        out_file = OUT_DIR / (pdf.stem + '.txt')
        out_file.write_text('\n'.join(text), encoding='utf-8')
        print(f'Extracted: {pdf.name} -> {out_file}')
    except Exception as e:
        print(f'Failed to extract {pdf.name}: {e}')
