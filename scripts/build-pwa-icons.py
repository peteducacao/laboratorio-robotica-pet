from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
source=root/'assets/tinkerpet-app-approved-512.webp'
with Image.open(source) as im:
    im.load()
    if im.size!=(512,512):
        raise RuntimeError('A arte aprovada precisa de 512 por 512 pixels')
    # Reduzir a partir da arte maior; jamais ampliar o ícone pequeno.
    im.convert('RGB').resize((192,192),Image.Resampling.LANCZOS).save(root/'assets/tinkerpet-app-approved-192.png',format='PNG',optimize=True)
print('Ícone de 192 pixels produzido a partir da logo aprovada de 512 pixels')
