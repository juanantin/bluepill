/* ==========================================================================
   What the indexer watches — $BLUEPILL on Base.
   --------------------------------------------------------------------------
   Every address here was READ FROM THE NETWORK by .github/workflows/
   discover.yml (scripts/discover-token.mjs) — never carried over from the
   token this site was copied from, and never read off the artwork.

   ⚠ Reconcile against what thestonks.exchange and stockify.finance publish
   for $BLUEPILL before trusting a number — scripts/panel-probe.mjs prints
   both side by side. On $BLUE they agreed to five decimal places, which is
   the bar. Nothing has traded yet (swap_count 0), so there is nothing to
   reconcile against and every total below will legitimately be zero until
   the first swap.
   ========================================================================== */

export const CHAIN_ID = 8453;                    // Base

export const TOKENS = {
  // The token people buy. Supplied by the owner; symbol() "BLUEPILL",
  // name() "BLUEPILL", decimals() 18, totalSupply 1,000,000,000 — all read
  // off chain and all matching what the artwork claims.
  STR: '0x9AA5dd27a7681E103880B159A358AC18FD04576A',
  /* The reward token holders are paid in — the quote side of the pair.
     symbol() "PFEc", name() "Pfizer Inc", decimals() 8, read off THIS
     contract. A TOKENIZED WRAPPER, not the listed equity, and note the
     ticker: PFEc, not the PFE the artwork says — the same decoration $BOX's
     "AMZNc" carried. */
  KEX: '0xb20000000000000000000018fe7ec7d6dfeeb528',
};

export const CONTRACTS = {
  // The trading pair, from /api/coins. Venue is aerodrome-slipstream.
  // Single-sourced: DexScreener has no pair to corroborate it with until
  // this token trades.
  pool: '0xa25f096d486925cebe6e80c83db9647a1a5904b7',
  /* Where trading fees accrue. NO STREAM MAY SUM IT — a locker is shared,
     and summing it reports other tokens' fees as this one's. It is here to
     be EXCLUDED from the holder count, nothing else.
     Note this is not the 0x71D1D363… the three siblings share: different
     venue, different locker. */
  feeLocker: '0x43555104f569d17026037e5637691b95c79fd03a',
  /* The distributor holders are paid from, from /api/fee-routing, which
     reports this token's routing as "rewards" with this index. It is also
     the `fee_owner` on the /api/coins entry — two of the platform's own
     records agreeing. Per token, which is what makes summing it this
     token's flows rather than the platform's. */
  rewardsIndex: '0x64cDA502645E0f6eaD8d03d46beb6E04A5b99F0E',
};

/* The block $BLUEPILL launched at, from the platform's /api/coins
   block_number. Nothing relevant happened before it, so the scan starts here
   rather than at genesis.

   ⚠ Only ONE source agrees so far. The usual corroboration is a timestamp
   search for the pool's own pairCreatedAt, and there is no pairCreatedAt
   while the token has never traded. Re-confirm after the first swap. */
export const START_BLOCK = 51805150;

/* Decimals, per token, READ FROM EACH CONTRACT rather than assumed. Two
   constants, never one: on $BOX they differed — its reward token's decimals()
   returns 8 where the token itself is 18 — and sharing a constant there
   published 25.244695737 as 2.5244695737e-9, every digit right and the scale
   out by ten billion. A token that is "obviously 18" is exactly the one
   nobody checks. */
export const STR_DECIMALS = 18;   // $BLUEPILL's own decimals(), read on chain
export const KEX_DECIMALS = 8;    // PFEc's own decimals(), read on chain
/* ↑ THIS IS THE ONE. They differ, and this is precisely the $BOX shape:
   there the reward token also returned 8 against an 18-decimal token, and
   sharing a single constant published 25.244695737 as 2.5244695737e-9 —
   every digit right, the scale out by ten billion. The artwork says "$PFE"
   and says nothing about decimals; the contract says 8. Never collapse
   these two constants into one, even if a future token has them agree. */

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

   ⚠⚠ UNVERIFIED, AND THERE IS EVIDENCE AGAINST 0.9 FOR THIS TOKEN. It is
   what $BOX's, $BLUE's and $PURR's panels read — but this token's /api/coins
   entry carries `platform_bps: 3000`, which is 30% in basis points. If that
   is the protocol's cut of the reward flow then holders receive 0.70, and
   this constant overstates every payout by about 28%.

   Left at 0.9 rather than swapped for a second guess: both are guesses, and
   with zero swaps the measured outflow is zero, so 0.9 × 0 = 0.7 × 0 and
   nothing on the page is wrong yet. It WILL be wrong the moment this token
   trades.

   RESOLVE BEFORE ANNOUNCING ANY PAYOUT FIGURE. scripts/panel-probe.mjs
   prints this token's own Stockify panel beside what this site publishes;
   on $BLUE those agreed to five decimals, which is the bar.

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
