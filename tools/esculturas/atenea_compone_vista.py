from PIL import Image, ImageFilter, ImageDraw
from rembg import remove, new_session
K = 4.4
body = Image.open('ref/atenea-cuerpo.png').convert('RGB').crop((18, 0, 138, 298))
body = body.resize((round(body.width * K), round(body.height * K)), Image.LANCZOS)
head = Image.open('ref/atenea-vistas.webp').convert('RGB')
# Ojos: hoja de cabeza (235,123) <-> cuerpo (60,30.5)*K
hx, hy, bx, by = 235, 123, 60 * K, 30.5 * K
box = (140, 25, 330, 235)
patch = head.crop(box)
mask = Image.new('L', patch.size, 0); d = ImageDraw.Draw(mask)
d.ellipse((12, 8, patch.width - 12, patch.height - 4), fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(14))
body.paste(patch, (round(bx - (hx - box[0])), round(by - (hy - box[1]))), mask)
body.save('in/compuesta.png')
s = new_session('isnet-general-use'); a = remove(body, session=s)
S = 1500; sq = Image.new('RGBA', (S, S), (255, 255, 255, 0)); sq.paste(a, ((S - a.width) // 2, (S - a.height) // 2), a)
sq.save('in/mv_front.png')
body.crop((150, 40, 420, 330)).save('in/cara_check.png')
