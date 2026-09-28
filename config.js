/* ==========================================================================
   SITE CONFIGURATION — $BLUEPILL
   --------------------------------------------------------------------------
   This is the only file you need to edit to point the site at a token.

   ⚠ BOOTSTRAP STATE. Everything the NETWORK has to answer is null on purpose,
   not because it is unknown-and-fine. Guessing any of it has a known cost on
   the sibling builds this was copied from: a guessed decimals() published a
   right answer at 10^-10 of its scale on one, and the reverse on another; a
   stale pool address reported a DIFFERENT token's market cap while the
   contract address above it looked perfectly correct.

   .github/workflows/discover.yml answers all of it from the contract address
   alone. Run it (push to a path it watches), read the job log, and paste its
   block in. Until then every null here renders as an em dash, which is the
   honest answer, and the indexer refuses to run at all.
   ========================================================================== */

window.SITE_CONFIG = {
  /* Build stamp. Shown in the ?debug=1 panel, so you can confirm which version
     a browser actually has rather than guessing at a cache. Bump it together
     with the ?v= on the script tags in index.html whenever you deploy —
     `node scripts/stamp.mjs` moves all of them at once. */
  version: '11',

  /* ---- Token ---------------------------------------------------------- */

  // The token people buy. The CA button copies this, the chart button links to
  // it, and DexScreener is searched by it. Supplied by the owner.
  contractAddress: '0x9AA5dd27a7681E103880B159A358AC18FD04576A',

  /* The token holders are paid in — the quote side of the pair. Used to price
     "total distributed" in USD.

     READ OFF CHAIN, not taken from the artwork: symbol() "PFEc", name()
     "Pfizer Inc", decimals() 8. The platform's /api/coins names it as this
     token's `quote` and agrees on the decimals. It is a TOKENIZED WRAPPER,
     not the listed equity — and note the ticker is PFEc, not PFE, exactly as
     $BOX's reward token answered "AMZNc" rather than "AMZN". */
  rewardTokenAddress: '0xb20000000000000000000018fe7ec7d6dfeeb528',

  // Free, keyless, CORS-enabled. Used as the last price source, because it
  // covers tokens DexScreener has no pair for — an index token among them.
  geckoterminalBase: 'https://api.geckoterminal.com/api/v2',

  chain: 'base',    // DexScreener chain slug
  chainId: 8453,    // EVM chain id

  /* The block $BLUEPILL launched at, from the platform's /api/coins
     block_number. The chain scan starts here; nothing relevant happened
     before it.

     ⚠ ONE SOURCE, not the usual two. The corroborating check is a timestamp
     search for the pool's own pairCreatedAt, and DexScreener has no pair for
     this token yet — it has not traded (swap_count 0), so there is no
     pairCreatedAt to search for. Re-confirm once it trades. A launch block
     that is too EARLY only costs scan time; too late and the backfill
     silently misses history, so this errs on the platform's figure rather
     than on a guess. */
  launchBlock: 51805150,

  /* How the reward token is recognised among everything that touches the
     distributor. Matched case-insensitively AND as a substring against each
     token's own symbol(), because a platform's wrapper decorates the ticker it
     wraps: $BOX's answered "AMZNc", and an exact comparison missed it.

     "PFEc" is what symbol() actually returns — read off the contract, not
     copied off the artwork, which says $PFE. The substring match means "PFE"
     would also hit it, but the exact reading is written down because that is
     the whole point of having read it. */
  rewardTokenSymbol: 'PFEc',

  /* Holders' share of what leaves the rewards index — the rest is the
     protocol's cut, so the outflow is NOT the distributed figure on its own.
     ✔ VERIFIED against THIS token's own Stockify panel, which states in as
     many words: "TO HOLDERS 90% — 10% protocol · 0% creator". Read by
     scripts/panel-probe.mjs on 2026-09-28, not inherited from the siblings
     that happen to share the figure.

     That run also cleared a false alarm worth recording. This token's
     /api/coins carries `platform_bps: 3000`, which reads as 30% in basis
     points and looked like evidence the split was really 0.70. It is not the
     holder split — the panel is unambiguous at 90/10/0. Do not "correct"
     this constant to 0.7 on the strength of that field.

     Still outstanding: the panel's own PAID OUT SO FAR reads "—" because
     nothing has been distributed yet, so the 0.9 is confirmed as a SETTING
     but has never been reconciled against a real payout. On $BLUE the panel
     and the indexer agreed to five decimals once money had actually moved;
     that check is still owed here and should be run after the first payout
     round. */
  holderShare: 0.9,

  /* Related contracts.
       pool         the trading pair — DexScreener is asked about THIS pool
                    first, and only falls back to searching by token address
       rewardPool   the reward token's own pair, used to price it
       feeLocker    where trading fees accrue
       rewardsIndex the distributor holders are paid from

     All null until discovery answers. `pool` is read on every load and
     DexScreener is asked about it BEFORE it searches by token address — so a
     wrong pool here silently reports another token's market cap, liquidity and
     volume. Left null, the search by contract address is used instead:
     correct, if slower. That is the safe default, so leave it null unless you
     are certain. */
  contracts: {
    /* The trading pair, from the platform's /api/coins entry for this token.
       Venue is aerodrome-slipstream, not the Uniswap v3 the siblings used.

       ⚠ SINGLE-SOURCED. Normally this is only named once DexScreener
       corroborates it, because DexScreener is asked about THIS pool BEFORE
       it searches by token address — so a wrong value here reports another
       token's market cap no matter what contractAddress says. DexScreener
       has no pair for this token yet, so there is nothing to corroborate
       against; the platform's own record for this token_id is the best
       source available. Re-confirm after the first trade. */
    pool: '0xa25f096d486925cebe6e80c83db9647a1a5904b7',
    rewardPool: null,
    /* Where trading fees accrue, from /api/coins. NEVER summed: a locker is
       shared, and summing it reports other tokens' fees as this one's.
       Recorded only so it can be excluded from the holder count.

       Worth noting: this is NOT the address the three siblings share
       (0x71D1D363…). This token launched on a different venue, so the
       platform gave it a different locker — which is a good reminder that
       "the locker is platform-wide" is an observation about those three,
       not a law. Either way it is excluded, never added up. */
    feeLocker: '0x43555104f569d17026037e5637691b95c79fd03a',
    /* The distributor holders are paid from — per token, and the only one of
       these that is this token's alone. Not derivable on chain: it is a
       routing decision, and /api/fee-routing reports this token's routing as
       "rewards" with this index. It is also the `fee_owner` on the /api/coins
       entry, which is two of the platform's own records agreeing. */
    rewardsIndex: '0x64cDA502645E0f6eaD8d03d46beb6E04A5b99F0E',
  },

  /* ---- Links ---------------------------------------------------------- */

  links: {
    x: 'https://x.com/BluePillBase',

    // Leave null to auto-build a DexScreener link from the contract address.
    chart: null,

    // The two lockups in the footer panel — both hrefs are written from here.
    // launchedIn is the platform's page for THIS token.
    //
    // rewardsBy is DERIVED, not supplied: Stockify indexes live at
    // /indices/<rewardsIndex lowercased>, which is the shape every sibling's
    // panel link takes. The index below is the one /api/fee-routing named for
    // this token. ⚠ Confirm it resolves before announcing — it is the one
    // link on this page built by pattern rather than read from a source.
    launchedIn: 'https://www.thestonks.exchange/token/0x9AA5dd27a7681E103880B159A358AC18FD04576A',
    rewardsBy: 'https://www.stockify.finance/indices/0x64cda502645e0f6ead8d03d46beb6e04a5b99f0e',
  },

  /* ======================================================================
     DATA SOURCES
     Each source fills in the fields it knows about. Later sources win, so
     `rewards` can override anything. Whatever no source provides falls back
     to `stats` below, and anything still missing renders as "—".
     ====================================================================== */

  sources: {

    /* Market cap, liquidity, 24h volume, and the token price.
       Public API, no key, CORS-enabled. */
    dexscreener: {
      enabled: true,
    },

    /* Holder count. DexScreener does not report holders, and no single
       explorer is reliable for a freshly launched token — a zero usually means
       "not indexed yet" rather than "no holders", so a zero is treated as no
       answer and falls through to the next provider.

       Run the page with ?debug=1 to see which provider answered. */
    holders: {
      enabled: true,

      /* `onchain` ALONE, deliberately. It folds the token's own Transfer logs
         into balances, exactly as the indexer does, so it is right by
         construction rather than by an explorer's luck. The explorer providers
         still work — add 'blockscout', 'geckoterminal', 'etherscan' or
         'moralis' here to chain them — but on a freshly launched token they
         are worse than nothing: for $BOX, GeckoTerminal answered 21 against a
         project that had made 365 wallet payments, and Blockscout 500s on a
         token that new. If no RPC answers, the tile shows a dash, which beats
         a confident wrong number. */
      providers: ['onchain'],

      onchain: {
        /* Tried in order; the first to answer runs the whole scan, since
           public nodes differ in how wide a getLogs range they allow and
           swapping mid-scan would make the chunk size meaningless.

           Seven, because a public endpoint's bad minute should not be the
           dashboard's bad day. Observed in a real browser: mainnet.base.org
           answers 500 under a sustained scan and publicnode answers 403 —
           between them they ended a scan that was 94% complete while a third
           URL sat unused. The scan moves down this list on any refusal and
           carries on from the same block. */
        rpcUrls: [
          'https://mainnet.base.org',
          'https://base.drpc.org',
          'https://base-mainnet.public.blastapi.io',
          'https://base.meowrpc.com',
          'https://1rpc.io/base',
          // Last two: observed refusing a browser outright rather than being
          // busy — publicnode with a 403, llamarpc with no CORS header at all.
          // Kept as a final resort, but they should not cost a probe first.
          'https://base-rpc.publicnode.com',
          'https://base.llamarpc.com',
        ],

        // Defaults to CFG.launchBlock; set it here to scan a shorter window.
        startBlock: null,

        chunkSize: 10000,      // halves itself when a window is refused, and
                               // climbs back after a few clean ones
        /* How small a window may get before the scan gives up on the node
           instead. 1,000 was not small enough: one dense stretch of $BOX
           trading refused at every size down to it, on all seven endpoints,
           and the cursor stopped there permanently. */
        minChunkSize: 200,
        confirmations: 5,      // stay clear of a reorg

        /* A page load spends at most this many requests, banks what it
           scanned in localStorage, and the next load resumes. The count is
           published only once the scan reaches the head: a partial fold has
           seen sends whose receives are in unread blocks, so it under-counts. */
        maxCallsPerLoad: 200,

        // Defaults to contracts.pool, feeLocker and rewardsIndex — they hold
        // supply without being holders.
        exclude: null,

        /* Fallbacks for the fee/payout queries, tried only if a node refuses
           eth_getLogs without an `address`. The unfiltered query is the better
           question, because it reports whichever token actually moved rather
           than trusting a guess, so these exist purely to survive a node that
           will not answer it. rewardTokenAddress is tried first.

           EMPTY ON PURPOSE: leaving a sibling's index address in here would
           ask a node about the wrong contract entirely. This token's own goes
           in once discovery reports it. */
        feeTokenCandidates: [],
      },

      blockscoutBase: 'https://base.blockscout.com',
      geckoterminalBase: 'https://api.geckoterminal.com/api/v2',
      etherscanApiKey: '',
      moralisApiKey: '',
    },

    /* Rewards figures — total fees collected and total rewards distributed.
       These are protocol numbers, so no explorer has them. See README.md.

       NOTE: this source is merged LAST, so anything it returns overrides
       DexScreener. Leaving stale figures in data/rewards.json while this is
       enabled will quietly override the live market cap, liquidity and volume
       — which is exactly how a market-cap tile got pinned to a stale figure on
       the $BLUE sibling. The committed file ships all-null for that reason. */
    rewards: {
      enabled: true,

      // A string, or an array of them — the first source with a number for a
      // metric wins, so put live endpoints in front of the committed file:
      //   url: ['https://<your-worker>.workers.dev', 'data/rewards.json'],
      url: 'data/rewards.json',

      fields: {
        totalFeesCollected: [
          'totalFeesCollected', 'totalFeesUsd', 'feesCollectedUsd', 'fees.totalUsd',
          'data.totalFeesCollected', 'stats.totalFeesCollected',
        ],
        totalFeesTokens: ['totalFeesTokens', 'feesTokens', 'data.totalFeesTokens'],
        totalDistributed: [
          'totalDistributed', 'totalRewardsDistributed', 'rewardsDistributed',
          'data.totalDistributed', 'stats.totalDistributed',
        ],
        totalDistributedUsd: [
          'totalDistributedUsd', 'totalRewardsDistributedUsd', 'rewardsDistributedUsd',
          'data.totalDistributedUsd', 'stats.totalDistributedUsd',
        ],
        holders: [
          'holders', 'holderCount', 'totalHolders', 'data.holders', 'stats.holders',
        ],
        marketCap: ['marketCap', 'marketCapUsd', 'data.marketCap'],
        liquidity: ['liquidity', 'liquidityUsd', 'data.liquidity'],
        volume24h: ['volume24h', 'volume24hUsd', 'volumeUsd24h', 'data.volume24h'],
      },
    },
  },

  // How often to refresh, in seconds. 0 disables auto-refresh.
  refreshSeconds: 60,

  /* ---- Fallbacks ------------------------------------------------------ */
  // Used only where no source supplies a value. Leave a field null and the
  // tile shows "—" rather than a number that isn't real. The figures printed
  // on the mockup are DESIGN PLACEHOLDERS and are deliberately not seeded
  // here: a mocked-up market cap that renders as though it were live is the
  // one number nobody would think to question.

  stats: {
    totalFeesCollected: null,
    totalFeesTokens: null,
    totalDistributed: null,
    totalDistributedUsd: null,
    holders: null,
    marketCap: null,
    liquidity: null,
    volume24h: null,
  },

};
