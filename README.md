# Bluepill — $BLUEPILL

Single-page site for $BLUEPILL on Base: a photographic hero, a drug-facts
label panel, and a live dashboard beside it. Static HTML/CSS/JS — no build
step, no dependencies, no framework.

Holders are paid in **$PFE**, the quote side of the pool — the platform's
**tokenized reward asset**, not Pfizer stock. That distinction is not
pedantry: on the `$BOX` sibling the reward token's own `symbol()` came back
`AMZNc` rather than `AMZN`, so the ticker is read off chain and described
accurately rather than inherited from the branding.

> **Not affiliated with, endorsed by, or connected to Pfizer Inc.** Bluepill
> is an independent meme token and a parody. "Pfizer", "Viagra" and all
> related marks belong to their respective owners. Nothing here is a
> medicine, a medical claim, or medical advice. The notice is repeated in the
> page footer, where visitors actually see it.

⚠ **Bootstrap state.** The contract address and the X account are set.
Everything the network has to answer — the pool, the reward token and its
decimals, the launch block, the fee locker, the rewards index — is **null on
purpose**, and the artwork has not landed yet. See
[`SETUP.md`](SETUP.md) for the order these get filled in and why the nulls
matter.

Copied from [`juanantin/purr`](https://github.com/juanantin/purr), which came
from `blue`, which came from `box`. Where a lesson below is written in one of
their numbers, those numbers are the evidence — the behaviour they describe is
the platform's, not that token's.

> **Not to be confused with** [`juanantin/blue`](https://github.com/juanantin/blue),
> which is a *different token*: The Stonkex Bull, `$BLUE`. Nothing from it —
> artwork, copy, palette, social tags or domain — belongs in this repo.

```
index.html            markup
config.js             ← the only file you need to edit to point it at a token
assets/css/styles.css
assets/js/app.js
images/               branding — the hero, the footer band and the icons
images/src/           the originals everything above is derived from
data/rewards.json     protocol figures the dashboard reads
scripts/              GitHub Actions indexer and probes
worker/               the same indexer as a Cloudflare Worker (optional)
```

## What's on the page

- **Top bar** — the Base lockup, and three pill buttons: X, the chart, and a
  button that copies the CA to the clipboard and flashes a `Copied!`
  confirmation beneath itself. It overlays the hero rather than sitting above
  it, so the page opens on the artwork.
- **Hero** — the product photograph, full-bleed. It carries the wordmark and
  the pitch, so the `<h1>` behind it is screen-reader only rather than
  painted twice.
- **Label panel** — the drug-facts parody: strength, total supply, "active
  ingredients" (what each transaction actually does) and "inactive
  ingredients" (the joke). The layout is the parody; every claim in it is
  true of the token.
- **Dashboard** — six live rows: total fees collected, total $PFE distributed
  (tokens, with the USD figure beneath), holders, market cap, liquidity and
  24h volume. Money carries cents, counts do not. Values blink a `…`
  placeholder until the first load resolves, and render `—` rather than a
  number that isn't real.
- **Footer** — the two ecosystem lockups, the tagline, and the fine print.

## Design

One face — **Inter**, from Google Fonts — across five weights. 800 is not
decoration: the wordmark and every figure are set in it, and asking for a
weight the file does not carry makes the browser synthesise it, which smears
the stems.

The palette is sampled from the mockup: `--ink` is the deep blue of the
carton's side panel, `--accent` the brighter blue of the 50 mg badge and every
icon. `--hero-ground` and `--foot-ground` sit **under** the two photographs —
they are what a visitor sees before the artwork loads and what shows at ratios
the photograph does not fill, so **resample them from the real artwork** when
it lands or the letterboxing reads as a seam.

Card icons are inline SVG on a shared stroke spec, so the six read as one set.
Every figure is set in tabular numerals, so a value that ticks up on refresh
does not shift the column it sits in.

Light theme only, by design — the artwork is a bright product photograph.

## Data sources

Everything configurable lives in `config.js`. Each source fills in the fields
it knows about and they merge in order, so a later source overrides an earlier
one. Whatever no source provides falls back to `stats`, and anything still
missing renders as `—` rather than as a number that isn't real.

| Metric | Source | Status |
|---|---|---|
| Market cap, liquidity, 24h volume | DexScreener | live, no key |
| Holders | on-chain fold of the token's own `Transfer` logs | live, no key |
| Total fees collected | the indexer | **off** until `worker/src/config.js` is filled |
| Total rewards distributed | the indexer | **off** until `worker/src/config.js` is filled |

### Market data — DexScreener

The configured pool is queried first — `GET /latest/dex/pairs/base/<pool>` —
falling back to the token search, `GET /latest/dex/tokens/<contract>`.

Pool-first matters when a token trades against something other than a usual
quote. **The corollary is a trap** — a stale or wrong pool address silently
reports another token's market cap, liquidity and volume, and the contract
address above it makes no difference. `contracts.pool` is null here, which
means the search by contract address is used: correct, if slower. Leave it
null until discovery is certain of it.

**Market metrics rank BELOW DexScreener**, deliberately, so a committed
snapshot can never outrank the live pool. Getting this backwards pinned a
market-cap tile to a stale figure on `blue`.

### Holders

The default provider is **`onchain`**, which does not ask an explorer
anything: it folds the token's own `Transfer` logs into a balance per address
in the browser, exactly as the indexer does, and counts the addresses left
holding something, less the pool, the fee locker and the rewards index.

No explorer is dependable for a freshly launched token — for `$BOX`,
GeckoTerminal answered 21 against a project that had made 365 wallet payments,
and Blockscout returned 500s. The explorer providers still work and can be
chained after it in `sources.holders.providers`; a zero is treated as *no
answer* and falls through, since a launched token with liquidity cannot have
zero holders.

That scan is budgeted and cached. A load spends at most `maxCallsPerLoad`
requests against the first RPC that answers, banks its progress in
`localStorage`, and the next load resumes. **The count is published only once
the scan reaches the head** — a partial fold has seen sends whose matching
receives are in unread blocks, so it under-counts, and a dash beats a wrong
number.

Run with `?debug=1` to see which provider answered.

### Rewards — fees and distribution

These are protocol figures. No explorer knows them, so they have to be fed in.
[`.github/workflows/index-rewards.yml`](.github/workflows/index-rewards.yml)
runs [`scripts/index-rewards.mjs`](scripts/index-rewards.mjs), scans Base, and
commits the refreshed `data/rewards.json` — the file the site already reads.
It counts holders too.

**The schedule is currently OFF**, because `worker/src/config.js` is still all
nulls. `index-rewards.mjs` refuses to scan while that file's `MISSING` list is
non-empty — a run against an unset index sums nothing and commits nulls every
quarter hour, which on the page is indistinguishable from a site that is
broken. Turn the cron back on in the same commit that fills the config.

Two independent traps live in `data/rewards-state.json`, and both look exactly
like a broken site:

- `loadState()` falls back to `START_BLOCK` only when that file is **absent**.
  A present file carrying a templated `cursor: 0` is read as gospel, and the
  indexer scans Base from genesis. The file is absent right now, which is
  correct; **seed it with `cursor` = `START_BLOCK` in the same commit that
  turns the cron on.**
- It is the **only** thing carrying the backfill between runs, because Actions
  runners are ephemeral. Never gitignore it.

**Verify the streams before you trust them.** Which on-chain flow is "fees
collected" and which is "distributed" differs per platform, and two mistakes
are easy: watching a **fee locker that every token on the platform shares**
(which sums the whole platform, not you — it is byte-for-byte the same address
on all three siblings, so it is recorded for holder-count exclusion and
**never summed**), and treating everything leaving the distributor as
"distributed" when part of it is the protocol's cut. `HOLDER_SHARE` carries
that split; `scripts/panel-probe.mjs` checks it against this token's own
Stockify panel. On `blue` the panel and the indexer agreed to five decimal
places — that is the bar, and **no payout figure gets announced before it is
met.**

### Verifying from a sandbox with no network

The changes here are written somewhere with **no route to Base, DexScreener,
the platform APIs or the deployed site**, so nothing can be confirmed locally
and a local pass never proves a thing is live. Two workflows ask a machine
that does have a route:

| Workflow | Asks |
|---|---|
| [`discover.yml`](.github/workflows/discover.yml) | what the chain and the platform say this token IS — pool, reward token, decimals, launch block, fee routing, launch artwork |
| [`probe.yml`](.github/workflows/probe.yml) | what the PAGE does with that — the committed site in a real browser, as a returning visitor, as a cold phone, and against the deployed URL |

Both run on a push to the paths they watch: `workflow_dispatch` 403s for this
token, so **a push to a watched path is the trigger**. Their summaries print
**last**, because job logs come back as a tail and the browser passes are
thousands of lines of retry noise.

### Debugging

Append `?debug=1`. A panel under the dashboard lists every source and what it
returned, and the same detail goes to the console. The first line is the build
stamp — if it is not the version you just pushed, the problem is the deploy or
a cache, not the code.

- **`Failed to fetch`** — CORS, a blocked host, or the page opened over
  `file://`. Serve it over `http://` rather than double-clicking the file.
- **`HTTP 404`** — wrong address or route.
- **`ok, empty`** — the request worked but that source has nothing for this
  token; the next fallback takes over.

If a card shows `—`, no source produced a number for it. That is the intended
behaviour, not a bug: nothing invented is shown as real.

## Deploying

**Vercel** — no framework preset, no build command, the repo root as output.
Two details are not optional, and both are in `vercel.json`:

- **`index.html` must send `Cache-Control: must-revalidate`.** It carries the
  `?v=` cache-busters, so a cached shell pins a visitor to an old build: the
  busting scheme only works if the document naming the versions is itself
  fresh. `data/rewards.json` is the same — it is the file the dashboard reads.
- **`vercel.json` takes headers and nothing else.** It rejects unknown
  top-level keys, and a `"//"` comment key once failed every production deploy
  for eighteen hours on `box` while the data behind it updated perfectly.
  Validate the key names, not just that the JSON parses.

**Run `node scripts/stamp.mjs` before every deploy** — it moves every `?v=`
and `config.js`'s `version` together. Skip it and a CDN keeps serving the
previous JS for hours after the HTML updates, which looks exactly like a push
that never landed.

## Running it

```bash
python3 -m http.server 8000
```

then open <http://localhost:8000>. (Clipboard copy needs `https://` or
`localhost`; the page falls back to `execCommand` elsewhere.)

The worker's tests need no network:

```bash
cd worker && npm test
```

While `worker/src/config.js` is unfilled, the tests that depend on it **skip
rather than fail** — that is the `MISSING` guard, not a broken suite.

## Notes

- The social card must be **letterboxed to 1200×630, never cropped**: X crops
  a large-image card to 2:1 and takes the sides. Social meta must be
  **absolute URLs** — a scraper has no page to resolve a relative path
  against. Both are currently pointed at a loud `REPLACE-WITH-DEPLOYMENT-URL`
  placeholder rather than a plausible guess.
- `favicon.ico` sits at the repo root because browsers request `/favicon.ico`
  on their own, whatever the `<link>` tags say. The apple-touch icon is
  flattened onto white, because iOS renders a transparent home-screen icon as
  black.
- The hero's ratio is set once, in `.hero__frame`'s `aspect-ratio`.
  `object-fit: cover` crops silently when the artwork disagrees with it, so
  change that one declaration rather than letting the crop decide what is
  lost.
- `images/src/` keeps the delivered originals and the commands that derive
  every served file from them.
