from pathlib import Path
from PIL import Image, ImageOps
root=Path(__file__).resolve().parents[1]
source=root/'assets/tinkerpet-app-192.png'
with Image.open(source) as im:
    im.load()
    if im.size!=(192,192):
        raise RuntimeError('Ícone de origem precisa de 192 por 192 pixels')
    image=ImageOps.fit(im.convert('RGB'),(512,512),method=Image.Resampling.LANCZOS)
    image.save(root/'assets/tinkerpet-app-512.png',format='PNG',optimize=True)
print('Ícone TinkerPET de 512 pixels produzido a partir da arte aprovada')
