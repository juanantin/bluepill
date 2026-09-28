/* ==========================================================================
   What the indexer watches — $BLUEPILL on Base.
   --------------------------------------------------------------------------
   ⚠ BOOTSTRAP STATE. Every address below is null on purpose. They are read
   from the network by .github/workflows/discover.yml (scripts/
   discover-token.mjs) — never carried over from the token this site was
   copied from, and never read off the artwork.

   While MISSING (below) is non-empty, scripts/index-rewards.mjs and the
   worker both REFUSE to scan. That refusal is the feature: a run against an
   unset index sums nothing and commits nulls every quarter hour, and on the
   page that is indistinguishable from a site that is broken.

   Once these are filled: reconcile against what thestonks.exchange and
   stockify.finance publish for $BLUEPILL before trusting a number —
   scripts/panel-probe.mjs prints both side by side. On $BLUE they agreed to
   five decimal places, which is the bar.
   ========================================================================== */

export const CHAIN_ID = 8453;                    // Base

export const TOKENS = {
  // The token people buy. Supplied by the owner, not discovered.
  STR: '0x9AA5dd27a7681E103880B159A358AC18FD04576A',
  /* The reward token holders are paid in — the quote side of the pair.
     ⚠ NULL UNTIL DISCOVERY RUNS. The artwork says $PFE, but the platform pays
     in a TOKENIZED WRAPPER, not the listed equity: on $BOX the wrapper's own
     symbol() read "AMZNc". The address is the reading that matters here; the
     ticker is decoration on top of it. */
  KEX: null,
};

export const CONTRACTS = {
  // The trading pair.
  pool: null,
  /* Where trading fees accrue. SHARED BY EVERY COIN on the platform — the
     same address $BOX, $BLUE and $PURR use — so no stream may sum it: doing
     so reports the whole platform's fees as this token's. */
  feeLocker: null,
  /* The distributor holders are paid from, from /api/fee-routing. Per token —
     which is what makes summing it this token's flows rather than the
     platform's. */
  rewardsIndex: null,
};

/* The block $BLUEPILL launched at. Nothing relevant happened before it, so
   the scan starts here rather than at genesis. discover.yml reports it from
   the platform's /api/coins block_number AND independently from a timestamp
   search for the pool's own pairCreatedAt; when those two agree, it is right. */
export const START_BLOCK = null;

/* Decimals, per token, READ FROM EACH CONTRACT rather than assumed. Two
   constants, never one: on $BOX they differed — its reward token's decimals()
   returns 8 where the token itself is 18 — and sharing a constant there
   published 25.244695737 as 2.5244695737e-9, every digit right and the scale
   out by ten billion. A token that is "obviously 18" is exactly the one
   nobody checks. */
export const STR_DECIMALS = null;
export const KEX_DECIMALS = null;

/* Everything that has to be real before a scan means anything. index-rewards
   and the worker both refuse to run while this list is non-empty. */
export const MISSING = Object.entries({
  'TOKENS.KEX': TOKENS.KEX,
  'CONTRACTS.pool': CONTRACTS.pool,
  'CONTRACTS.rewardsIndex': CONTRACTS.rewardsIndex,
  START_BLOCK,
  KEX_DECIMALS,
}).filter(([, v]) => v === null || v === undefined || v === '').map(([k]) => k);

/* The three flows the totals are built from:

     `feesIn`   reward tokens ARRIVING at the distributor — "fees collected"
     `paidOut`  everything LEAVING it: holder payments plus the protocol's cut,
                so it is not the "distributed" figure on its own
     `holders`  every token transfer folded into a running balance per address;
                addresses left holding something are the holder count

   Verify these against the platform's own panel before trusting them. */
export const STREAMS = [
  { id: 'feesIn', kind: 'sum', token: TOKENS.KEX, to: CONTRACTS.rewardsIndex, decimals: KEX_DECIMALS },
  { id: 'paidOut', kind: 'sum', token: TOKENS.KEX, from: CONTRACTS.rewardsIndex, decimals: KEX_DECIMALS },
  { id: 'holders', kind: 'balances', token: TOKENS.STR, decimals: STR_DECIMALS },
];

/* Share of the outflow that reaches holders — the rest is the protocol's cut.

   ⚠ NOT YET VERIFIED FOR THIS TOKEN. 0.9 is the platform's usual split and
   what $BOX's, $BLUE's and $PURR's panels read, but it is a per-token setting
   and the one multiplier between the measured outflow and the figure on the
   tile. scripts/panel-probe.mjs prints this token's own Stockify panel beside
   what this site publishes; on $BLUE those agreed to five decimals, which is
   the bar. Until then the distributed figure is provisional and must not be
   announced.

   Better still, set PROTOCOL_ADDRESS if the protocol's address turns up — the
   cut is then subtracted exactly and survives the percentage changing. */
export const HOLDER_SHARE = 0.9;
export const PROTOCOL_ADDRESS = null;

if (PROTOCOL_ADDRESS) {
  STREAMS.push({
    id: 'protocolOut', kind: 'sum', token: TOKENS.KEX,
    from: CONTRACTS.rewardsIndex, to: PROTOCOL_ADDRESS, decimals: KEX_DECIMALS,
  });
}

/** Tokens that actually reached holders. */
export function holderPayout(totals) {
  const paidOut = totals.paidOut ?? 0;
  if (PROTOCOL_ADDRESS) return Math.max(0, paidOut - (totals.protocolOut ?? 0));
  return paidOut * HOLDER_SHARE;
}

/* Addresses that hold supply but are not holders in the sense the tile means:
   the pool itself, the fee locker, the rewards contract. */
export const EXCLUDE_FROM_HOLDERS = [
  CONTRACTS.pool,
  CONTRACTS.feeLocker,
  CONTRACTS.rewardsIndex,
].filter(Boolean).map((a) => a.toLowerCase());

/* Scan pacing. A Worker run is short, so it takes bites and resumes. Raise
   MAX_CHUNKS_PER_RUN to backfill faster; lower CHUNK_SIZE if the RPC complains
   (it halves automatically anyway). */
export const CHUNK_SIZE = 2000;
export const MAX_CHUNKS_PER_RUN = 60;
export const CONFIRMATIONS = 5;

// Price the token totals in USD. Public, no key.
export const DEXSCREENER_PAIR =
  'https://api.dexscreener.com/latest/dex/pairs/base/' + CONTRACTS.pool;
export const DEXSCREENER_KEX_TOKEN =
  'https://api.dexscreener.com/latest/dex/tokens/' + TOKENS.KEX;
