from pathlib import Path
lines=Path('fallingsand.ipynb').read_text().splitlines()
for i in range(190,250):
    print(i+1, lines[i])
