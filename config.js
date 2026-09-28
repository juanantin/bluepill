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
  version: '2',

  /* ---- Token ---------------------------------------------------------- */

  // The token people buy. The CA button copies this, the chart button links to
  // it, and DexScreener is searched by it. Supplied by the owner.
  contractAddress: '0x9AA5dd27a7681E103880B159A358AC18FD04576A',

  /* The token holders are paid in — the quote side of the pair. Used to price
     "total distributed" in USD.

     ⚠ NULL UNTIL DISCOVERY RUNS. The artwork says $PFE, and the platform's
     reward token is a TOKENIZED WRAPPER rather than the listed equity — on the
     $BOX sibling the wrapper's own symbol() came back "AMZNc", not "AMZN".
     What this token's wrapper actually calls itself is a reading, not a guess,
     and the copy on the page has to match whatever it returns. */
  rewardTokenAddress: null,

  // Free, keyless, CORS-enabled. Used as the last price source, because it
  // covers tokens DexScreener has no pair for — an index token among them.
  geckoterminalBase: 'https://api.geckoterminal.com/api/v2',

  chain: 'base',    // DexScreener chain slug
  chainId: 8453,    // EVM chain id

  /* The block this token launched at — the chain scan starts here.
     ⚠ NEVER leave a sibling's block in this field and never leave it null
     once the indexer is on: both mean scanning blocks that have nothing to do
     with this token. discover.yml reports it from two independent sources. */
  launchBlock: null,

  /* How the reward token is recognised among everything that touches the
     distributor. Matched case-insensitively AND as a substring against each
     token's own symbol(), because a platform's wrapper decorates the ticker it
     wraps: $BOX's answered "AMZNc", and an exact comparison missed it.

     Null on purpose. With this null the configured ADDRESS is used instead —
     never a ticker inherited from the token this repo was copied from, and
     never one read off the artwork. Set it to whatever symbol() actually
     returns once discovery reports it. */
  rewardTokenSymbol: null,

  /* Holders' share of what leaves the rewards index — the rest is the
     protocol's cut, so the outflow is NOT the distributed figure on its own.
     ⚠ UNVERIFIED FOR THIS TOKEN. 0.9 is the platform's usual split and what
     $BOX's, $BLUE's and $PURR's panels all read, but it is a PER-TOKEN setting
     and it is the one multiplier standing between the measured outflow and the
     figure on the tile. scripts/panel-probe.mjs reads THIS token's own
     Stockify panel for it; until that agrees, the distributed figure is
     provisional and must not be announced. On $BLUE the panel and the indexer
     agreed to five decimal places — that is the bar. */
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
    pool: null,
    rewardPool: null,
    /* Where trading fees accrue. SHARED BY EVERY TOKEN on the platform — the
       same address on all three siblings — so it is NEVER summed: doing that
       reports the whole platform's fees as this token's. Recorded only so it
       can be excluded from the holder count. */
    feeLocker: null,
    /* The distributor holders are paid from — per token, and the only one of
       these that is this token's alone. Not derivable on chain: it is a
       routing decision, and the platform's /api/fee-routing reports it. */
    rewardsIndex: null,
  },

  /* ---- Links ---------------------------------------------------------- */

  links: {
    x: 'https://x.com/BluePillBase',

    // Leave null to auto-build a DexScreener link from the contract address.
    chart: null,

    // The two lockups in the footer panel — both hrefs are written from here.
    // launchedIn is the platform's page for THIS token; rewardsBy is this
    // token's own Stockify index, which is still to come from the owner.
    launchedIn: 'https://www.thestonks.exchange/token/0x9AA5dd27a7681E103880B159A358AC18FD04576A',
    rewardsBy: null,
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
