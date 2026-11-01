from pathlib import Path
from PIL import Image, ImageOps
from io import BytesIO

root=Path(__file__).resolve().parents[1]
source=root/'assets/tinkerpet-logo-source.jpg'
with Image.open(source) as im:
    im.load()
    if im.width<180 or im.height<180:
        raise RuntimeError('A fonte do ícone não tem resolução suficiente')
    im=ImageOps.fit(im.convert('RGB'),(512,512),method=Image.Resampling.LANCZOS)
    for size in (192,512):
        target=root/f'assets/tinkerpet-app-{size}.png'
        im.resize((size,size),Image.Resampling.LANCZOS).save(target,format='PNG',optimize=True)
print('Ícones TinkerPET gerados: 192 e 512 pixels')
