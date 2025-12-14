import fitz
import pathlib
import sys
if len(sys.argv) < 2:
    raise SystemExit('Need pdf path')
pdf_path=pathlib.Path(sys.argv[1])
doc=fitz.open(pdf_path)
print('processing', pdf_path, 'pages', len(doc))
with open(pdf_path.with_suffix('.txt'), 'w', encoding='utf-8') as out:
    for page in doc:
        out.write(page.get_text())
        out.write('\n\f\n')
