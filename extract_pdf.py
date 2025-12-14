import fitz
import pathlib
path=pathlib.Path('Falling Sand.pdf')
doc=fitz.open(path)
with open('fallingsand.txt','w',encoding='utf-8') as out:
    for page in doc:
        out.write(page.get_text())
        out.write('\n\f\n')
print('extracted', len(doc), 'pages')
