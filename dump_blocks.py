import fitz
path='Falling Sand.pdf'
for i,page in enumerate(fitz.open(path)):
    blocks=page.get_text('blocks')
    print('page', i, 'block count', len(blocks))
    for blk in blocks:
        print('block', blk)
