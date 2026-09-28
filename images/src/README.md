# Originals

The artwork as delivered. Nothing in here is loaded by the page — everything
the page serves is **derived** from these three files by the commands below.
Keep that arrangement: it is what makes "re-cut the card" a one-liner rather
than a request back to whoever made the picture.

| Original | What it is | What comes from it |
|---|---|---|
| `bluepill_header.png` | The header photograph, 1536×1024 (3:2) | `images/hero.jpg`, `images/hero.webp`, `images/social.jpg` |
| `bluepill_bg.png` | The pill field, 1101×1428 (portrait) | `images/bg.jpg`, `images/bg.webp` |
| `bluepill_icon.png` | The pill mark, 1098×1098, already a clean transparent cut-out | every icon, and `/favicon.ico` |
| `launch_banner.jpg`, `launch_mark.jpg` | The artwork the token was **launched** with, pulled off the platform by [`fetch-art.yml`](../../.github/workflows/fetch-art.yml) | nothing — kept as provenance. The owner's own files above supersede them. |

The three PNGs total 4.6 MB. What the page actually serves is about 900 KB,
which is the entire point of this folder.

## Where each one lands

- **The header** fills `.hero__frame`, whose `aspect-ratio` is set to **3:2 to
  match it exactly**, so `object-fit: cover` crops nothing horizontally. That
  matters: the carton spans nearly the full frame, and a horizontal crop takes
  "50 mg" off one side and the Base pill off the other. There is a
  `max-height: 78vh` cap so the hero does not eat the whole viewport, and
  `object-position: center 32%` biases what the cap trims onto the reflective
  floor at the bottom rather than the carton at the top.
- **The pill field** is `.pillfield`, a `position: fixed` layer behind
  everything below the hero — the parallax backdrop the panels float on. It is
  a fixed ELEMENT rather than `background-attachment: fixed`, because iOS
  Safari sizes a fixed background to the document instead of the viewport and
  the picture arrives hugely zoomed.
- **The mark** is icons only.

**If you replace any of them**, re-run the matching block below, then
`node scripts/stamp.mjs`, and resample the grounds — see the bottom of this
file.

## Deriving the served files

```bash
python3 - <<'EOF'
from PIL import Image

# hero — two formats; the webp is what almost every visitor gets
src = Image.open('images/src/bluepill_header.png').convert('RGB')
src.save('images/hero.jpg', 'JPEG', quality=88, optimize=True, progressive=True)
src.save('images/hero.webp', 'WEBP', quality=86, method=6)

# the pill field
bg = Image.open('images/src/bluepill_bg.png').convert('RGB')
bg.save('images/bg.jpg', 'JPEG', quality=84, optimize=True, progressive=True)
bg.save('images/bg.webp', 'WEBP', quality=82, method=6)
EOF
```

### The social card — letterbox it, never crop it

```bash
python3 - <<'EOF'
from PIL import Image
art = Image.open('images/src/bluepill_header.png').convert('RGB')
w, h = art.size
art = art.resize((1200, round(h * 1200 / w)), Image.LANCZOS)
card = Image.new('RGB', (1200, 630), (58, 114, 215))   # --hero-ground
if art.height > 630:                  # taller than the card: centre-crop
    top = (art.height - 630) // 2     # VERTICALLY only, never the sides
    art = art.crop((0, top, 1200, top + 630))
card.paste(art, (0, (630 - art.height) // 2))
card.save('images/social.jpg', 'JPEG', quality=88, optimize=True)
EOF
```

**X crops a large-image card to 2:1 and takes the SIDES.** On a 3:2 header
that removes the carton's ends, which is how a shared link ends up showing an
anonymous blue smear. Fit to width and letterbox the remainder.

### Icons

```bash
python3 - <<'EOF'
from PIL import Image
m = Image.open('images/src/bluepill_icon.png').convert('RGBA')
m = m.crop(m.getbbox())                        # trim to its own alpha bounds
s = max(m.size)
sq = Image.new('RGBA', (s, s), (0, 0, 0, 0))   # pad square, stay TRANSPARENT
sq.paste(m, ((s - m.width) // 2, (s - m.height) // 2))
for px, name in [(32, 'favicon.png'), (192, 'icon-192.png'), (512, 'icon-512.png')]:
    sq.resize((px, px), Image.LANCZOS).save(f'images/{name}', optimize=True)
# iOS renders a transparent home-screen icon as BLACK, so this one alone is
# flattened onto white. It is the only one that is.
ios = Image.new('RGB', (s, s), (255, 255, 255))
ios.paste(sq, mask=sq.split()[3])
ios.resize((180, 180), Image.LANCZOS).save('images/apple-touch-icon.png', optimize=True)
sq.resize((48, 48), Image.LANCZOS).save('favicon.ico', sizes=[(16,16),(32,32),(48,48)])
EOF
```

The supplied mark already carries real alpha, so there is nothing to cut out —
`getbbox()` trims it and the rest is resizing. If a future mark arrives on an
opaque white square, cut the ground by distance-from-white first, or the icon
carries a white card around with it on a dark tab strip.

`favicon.ico` sits at the **repo root** because browsers request
`/favicon.ico` on their own, whatever the `<link>` tags say.

## Resampling the grounds

`--hero-ground` and `--page` in [`assets/css/styles.css`](../../assets/css/styles.css)
sit *under* the photographs — they are what shows before the artwork loads and
at any ratio it does not fill, so a guessed value reads as a seam. Measure
them, do not pick them by eye:

```bash
python3 - <<'EOF'
from PIL import Image
h = Image.open('images/src/bluepill_header.png').convert('RGB'); w, ht = h.size
px = list(h.crop((0,0,w,12)).getdata()) + list(h.crop((0,ht-12,w,ht)).getdata())
print('--hero-ground  #%02x%02x%02x' % tuple(sum(c[i] for c in px)//len(px) for i in range(3)))
b = Image.open('images/src/bluepill_bg.png').convert('RGB'); w, _ = b.size
px = list(b.crop((0,0,w,12)).getdata())
print('--page         #%02x%02x%02x' % tuple(sum(c[i] for c in px)//len(px) for i in range(3)))
EOF
```

The current values — `#3a72d7` and `#2b5ebf` — came from exactly this.

## Then, always

```bash
node scripts/stamp.mjs
```

It moves every `?v=` in `index.html` **and** `assets/css/styles.css` (the
stylesheet loads the pill field, so it carries its own) together with
`version` in `config.js`. Skip it and a CDN serves the old artwork and the old
JS after the HTML updates, which looks exactly like a push that never landed.
