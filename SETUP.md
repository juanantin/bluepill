# Making this yours

The checklist for pointing the site at a token, in the order that works. It
was used on three builds before this one; the order is not cosmetic, because
several of the steps below make the next one safe.

**State for $BLUEPILL right now:** step 1 is half done (the contract address
and the X account are set; everything the network must answer is null), and
steps 0, 2, 3 and 4 are outstanding.

## 0. Let the network answer first

Most of step 1 is discoverable from the contract address alone, and guessing
any of it has a known cost. **Run the discovery workflow before editing
anything:**

```
.github/workflows/discover.yml  →  scripts/discover-token.mjs
```

Push a change to either path and it runs — `workflow_dispatch` 403s for this
token, so a push to a watched path is the trigger. From the contract address
it reports:

- every DexScreener pair on Base, deepest first — **the pool**
- the deepest pair's other side — **the reward token**
- `symbol()`, `name()`, `decimals()` and `totalSupply()` for both, read off
  chain and **each failure labelled**, so a throttled call can never be
  mistaken for a reading
- **the launch block**, from a timestamp search for the pool's `pairCreatedAt`
- the platform's own entry: fee locker, launch block, the official image and
  banner, and `/api/fee-routing`'s **rewards index**
- whether a candidate address really is the distributor — set `CANDIDATES`
  and it reports the reward-token flow in and out of it

It prints a paste-ready block at the end. Read the job log with
`get_job_logs`; **the summary is deliberately last**, because logs come back
as a tail.

> `CANDIDATES` is currently empty on purpose. The sibling repo shipped with
> *its* rewards index sitting in that field; leaving it would have had the
> run confidently report the wrong token's distributor.

Only two things are not discoverable: **`holderShare`**, which is a per-token
setting on the platform's panel, and artwork.

## 1. Addresses and links

`config.js`

- `contractAddress` — **set**: `0x9AA5dd27a7681E103880B159A358AC18FD04576A`.
- `rewardTokenAddress` — **null.** The token holders are paid in, used to
  price distributed rewards in USD.
- `rewardTokenSymbol` — **null.** Matched **case-insensitively and as a
  substring** against the token's own `symbol()`, because platforms decorate
  the ticker they wrap: `$BOX`'s reward token answers `AMZNc`, not `AMZN`.
  With this null the configured address is used instead — never a ticker
  inherited from the repo this was copied from, and **never one read off the
  artwork.**
- `launchBlock` — **null.** The chain scan starts here. Never leave it null
  once the indexer is on, and **never leave a sibling token's block in it**;
  both mean scanning blocks that have nothing to do with this token.
- `contracts.pool` — **null. Leave it null unless you are certain.**
  DexScreener is asked about this pool *before* it searches by token address,
  so a wrong pool reports another token's market cap, liquidity and volume no
  matter what `contractAddress` says.
- `contracts.feeLocker` — **shared by every token on the platform.** Recorded
  so it can be excluded from the holder count, **never summed**.
- `contracts.rewardsIndex` — the per-token distributor, and the only one of
  these that is yours. Not derivable on chain.
- `links.x` — **set**: `https://x.com/BluePillBase`.
- `links.launchedIn` — **set** to the platform's page for this contract.
- `links.rewardsBy` — **null.** This token's Stockify index URL
  (`https://www.stockify.finance/indices/0x…`). Still needed.
- `holderShare` — **check the token's own Stockify panel.** It is the one
  multiplier between the measured outflow and the figure on the tile.

## 2. Branding

Everything here is outstanding. [`images/src/README.md`](images/src/README.md)
is the full instruction sheet — what to drop in, and the commands that derive
every served file from it. In short:

- `images/hero.jpg` + `.webp` — the header photograph. The hero frame is
  **16:9** (4:3 under 900px, 1:1 under 640px); `object-fit: cover` crops
  silently when the artwork disagrees, so match the ratio or change the one
  `aspect-ratio` declaration in `assets/css/styles.css`.
- `images/footer.jpg` + `.webp` — the lower band. Type runs over it, so it
  wants to be empty in the middle.
- `images/social.jpg` — **letterboxed to 1200×630, never cropped.** X crops a
  large-image card to 2:1 and takes the sides.
- The icons — generated from the mark, **cropped to its most recognisable
  part and padded back to a square.** A full scene shrinks to noise at 16px.
  The apple-touch icon is flattened onto white, because iOS renders a
  transparent home-screen icon as black.
- `assets/css/styles.css` — **`--hero-ground` and `--foot-ground` are sampled
  from the artwork's own edge.** They sit under the two photographs, so a
  wrong value shows up as a seam in two places at once. `--ink` and
  `--accent` are the deep and bright blues.
- `index.html` — the `<title>`, the description, the OG/Twitter meta (all
  currently pointing at a deliberately-broken `REPLACE-WITH-DEPLOYMENT-URL`),
  the label-panel rows, and **the non-affiliation notice in the footer.**

> The platform publishes the artwork the token launched with, and
> `.github/workflows/fetch-art.yml` pulls it into `images/src/`
> automatically. Push to that file to run it. It is a floor, not a ceiling.

Then run `node scripts/stamp.mjs`, which moves every `?v=` so browsers drop
the cached mark.

### The non-affiliation notice is not optional

This site leans on a real pharmaceutical brand and a real product. The footer
names **Pfizer Inc.** and **Viagra**, states that no sponsorship or
association is claimed or implied, and says the page is neither a medicine
nor medical advice. The `box` original carried exactly this shape of notice
for Amazon. If the artwork changes to lean on something else, the notice
changes with it.

Three things this build will not do, whatever the mockup shows:

1. **No fabricated endorsement from a real person** — no invented quotes,
   signatures or testimonials, however small the caption.
2. **No fabricated official documents** — nothing styled to read as a genuine
   artifact of a real company. The label panel is a parody *layout*; it
   carries no NDC, no lot number, no dosing instruction and no manufacturer's
   imprint, and every row in it is true of the token. A real, publicly
   published line may be quoted **as a quotation, with a link to its source.**
3. **Be exact about what holders receive.** The reward token is a **tokenized
   wrapper, not equity.** On `box` its `symbol()` read `AMZNc`, which had to
   be read off chain rather than assumed from the branding. Let the discovery
   run say what it is; the footer and the label panel both say so plainly.

## 3. Live figures

Market cap, liquidity, volume and holders come in on their own once
`contractAddress` is set — that is already true. Fees collected and rewards
distributed do not.

To index them, fill in `worker/src/config.js`:

- `TOKENS` and `CONTRACTS`
- **`START_BLOCK`** — the block the token was deployed in. Left at `0` the
  scan starts at genesis and will never finish.
- **`STR_DECIMALS` and `KEX_DECIMALS`** — read from each contract, and kept
  as two constants even when they agree. `$BOX`'s reward token returns 8
  where the token itself is 18; sharing one constant there published
  25.244695737 as 2.5244695737e-9 — every digit right, the scale out by ten
  billion.
- `STREAMS` and `HOLDER_SHARE` encode one assumption: fees arrive at
  `rewardsIndex` in the reward token, and holders receive `HOLDER_SHARE` of
  what leaves it. Check that against the platform's own published figures
  before trusting a single number on the page.

`MISSING` at the top of that file lists whatever is still null, and
`scripts/index-rewards.mjs` **refuses to scan while it is non-empty.** You can
see the guard working right now: `cd worker && npm test` passes 18 and skips
8, and the 8 are exactly the ones that need a real config.

Then, **in the same commit**:

1. **Seed `data/rewards-state.json` with `cursor` = `START_BLOCK` and commit
   it.** The file is **absent** right now, which is correct — `loadState()`
   falls back to `START_BLOCK` only when it is absent, so a present file
   carrying a templated `cursor: 0` is read as gospel and scans Base from
   genesis. It is also the **only** thing carrying the backfill between runs,
   since Actions runners are ephemeral, so never gitignore it.
2. **Uncomment the `schedule:` block** in
   [`.github/workflows/index-rewards.yml`](.github/workflows/index-rewards.yml).
   It runs four times an hour, off the :00/:15/:30/:45 boundary where
   GitHub's scheduler is most oversubscribed.

## 4. Repo settings

- **Deployment is Vercel, not GitHub Pages.** Import the repo: no framework
  preset, no build command, output is the repo root. `vercel.json` carries
  the cache headers and **only** headers — that file rejects unknown
  top-level keys, and a `"//"` comment key once failed every production
  deploy for eighteen hours while the data behind it updated perfectly.
  Validate the key names, not just that the JSON parses.
- Once Vercel is connected it writes the deployment URL into the repo's
  `homepage` field, readable from the GitHub API. **Put that URL into the
  OG/Twitter meta** in `index.html`, replacing every
  `REPLACE-WITH-DEPLOYMENT-URL`.
- Set the **`SITE_URL` repository variable** (Settings ▸ Secrets and
  variables ▸ Actions ▸ Variables) to the same URL. The probe workflow's
  live-site pass skips itself while it is unset, because there is genuinely
  nothing to probe; once set, it is the only pass that proves what a visitor
  is actually served.
- Add an `RPC_URL` secret if you have a private Base RPC. Without it the
  indexer falls back to the public `mainnet.base.org`, which works but
  rate-limits — the backfill just takes more runs.

## 5. Before you announce it

- Run the probe workflow and read all four passes, the live-site one
  included. **A local pass proves the code is right, never that it is live**
  — that distinction hid a broken deploy for a full day on `$BOX`.
- Load the site with `?debug=1` and read the source panel: every line should
  be `ok`, and any `—` should be a figure you know is not fed yet. The first
  line is the build stamp; if it is not the version you just pushed, the
  problem is the deploy or a cache, not the code.
- Check the CA button copies the **full** address, not the truncation on its
  face, and that the chart button opens the right token.
- **Reconcile fees, distribution and holders against the platform's own
  panels** before quoting any of them. `scripts/panel-probe.mjs` prints this
  token's Stockify panel beside what the site publishes. On `blue` they
  agreed to five decimal places — that is the bar. **Do not publish a payout
  figure you have not cross-checked.**
