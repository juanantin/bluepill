# Originals — drop your artwork here

Nothing in this folder is loaded by the page. It holds the files as supplied,
and everything the page serves is **derived** from them by the commands below.
Keep that arrangement: it is what makes "re-cut the card" a one-liner rather
than a request back to whoever made the picture.

## What to put here

| Put here | What it is | Derives |
|---|---|---|
| `hero_src.*` | The header artwork — the Bluepill carton on the bed of blue capsules. **16:9 or wider**, 2048px on the long edge or better. | `images/hero.jpg`, `images/hero.webp`, `images/social.jpg` |
| `footer_src.*` | The lower background band. Wide and mostly empty in the middle — type goes over it. | `images/footer.jpg`, `images/footer.webp` |
| `mark_src.png` | The square mark for the icons. **A transparent cut-out works best.** | every icon below |

The page references `images/hero.jpg` / `.webp` and `images/footer.jpg` /
`.webp` by those exact names, so either produce them with the commands below
or rename your files to match. Until they exist the hero and the footer show
their solid blue grounds — the page is not broken, it is just unillustrated.

> The platform also publishes whatever artwork the token launched with.
> `.github/workflows/fetch-art.yml` pulls it into this folder automatically
> (push to that file to run it). That is a **floor**, not a ceiling: if the
> owner has something better, theirs wins.

## Deriving the served files

```bash
# hero — served at two formats; the webp is what almost every visitor gets.
python3 - <<'EOF'
from PIL import Image
src = Image.open('images/src/hero_src.png').convert('RGB')
w, h = src.size
out = src.resize((2048, round(h * 2048 / w)), Image.LANCZOS)
out.save('images/hero.jpg', 'JPEG', quality=88, optimize=True)
out.save('images/hero.webp', 'WEBP', quality=88, method=6)
EOF

# footer — same idea, no downscale below 2048 wide.
python3 - <<'EOF'
from PIL import Image
src = Image.open('images/src/footer_src.png').convert('RGB')
w, h = src.size
out = src.resize((2048, round(h * 2048 / w)), Image.LANCZOS)
out.save('images/footer.jpg', 'JPEG', quality=86, optimize=True)
out.save('images/footer.webp', 'WEBP', quality=86, method=6)
EOF
```

### The social card — letterbox it, never crop it

```bash
python3 - <<'EOF'
from PIL import Image
art = Image.open('images/src/hero_src.png').convert('RGB')
w, h = art.size
art = art.resize((1200, round(h * 1200 / w)), Image.LANCZOS)
card = Image.new('RGB', (1200, 630), (42, 90, 200))   # --hero-ground
if art.height > 630:                  # taller than the card: centre-crop
    top = (art.height - 630) // 2     # vertically only, never the sides
    art = art.crop((0, top, 1200, top + 630))
card.paste(art, (0, (630 - art.height) // 2))
card.save('images/social.jpg', 'JPEG', quality=88, optimize=True)
EOF
```

**X crops a large-image card to 2:1 and takes the SIDES.** On a banner wider
than that, the crop removes the carton from one end and the capsules from the
other, which is how a shared link ends up showing an anonymous blue smear.
`images/social.jpg` is the artwork letterboxed onto 1200×630 on a ground
sampled from its own border, so nothing is ever cut horizontally.

The `(42, 90, 200)` above is `--hero-ground` in
[`assets/css/styles.css`](../../assets/css/styles.css). **Resample it from the
real artwork's edge** once that arrives — the same value is what the hero and
the letterbox both sit on, so a wrong one shows up as a seam in two places.

### Icons

```bash
# Crop the mark to its MOST RECOGNISABLE PART and pad back to a square before
# resizing. A full scene shrinks to a smudge at 16px.
python3 - <<'EOF'
from PIL import Image
m = Image.open('images/src/mark_src.png').convert('RGBA')
m = m.crop(m.getbbox())                        # trim to its own alpha bounds
s = max(m.size)
sq = Image.new('RGBA', (s, s), (0, 0, 0, 0))   # pad to square, TRANSPARENT
sq.paste(m, ((s - m.width) // 2, (s - m.height) // 2))
for px, name in [(32, 'favicon.png'), (192, 'icon-192.png'), (512, 'icon-512.png')]:
    sq.resize((px, px), Image.LANCZOS).save(f'images/{name}')
# iOS renders a transparent home-screen icon as BLACK, so this one is
# flattened onto white. It is the only one that is.
ios = Image.new('RGB', (s, s), (255, 255, 255))
ios.paste(sq, mask=sq.split()[3])
ios.resize((180, 180), Image.LANCZOS).save('images/apple-touch-icon.png')
sq.resize((48, 48), Image.LANCZOS).save('favicon.ico', sizes=[(16,16),(32,32),(48,48)])
EOF
```

`favicon.ico` sits at the **repo root** because browsers request `/favicon.ico`
on their own, whatever the `<link>` tags say.

## Then, always

```bash
node scripts/stamp.mjs
```

It moves every `?v=` in `index.html` and `version` in `config.js` together.
Skip it and a CDN serves the old icons and the old JS after the HTML updates,
which looks exactly like a push that never landed.
