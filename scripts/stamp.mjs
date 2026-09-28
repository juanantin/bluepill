#!/usr/bin/env node
/* ==========================================================================
   Cache-buster stamp
   --------------------------------------------------------------------------
   index.html loads its stylesheet, config.js and app.js with a ?v= query,
   the stylesheet in turn loads the background artwork with one, and
   config.js carries a matching `version` that the ?debug=1 panel prints. All
   of them have to move together: a CDN will otherwise keep serving the
   previous JS for hours after the HTML updates, which looks exactly like a
   push that never landed.

   The stylesheet is in the list because it once carried its own ?v= — the
   pill field was loaded from CSS — and left out, those pinned at v=1 while
   every other number advanced, so a replaced background kept serving the
   old picture. That field has since been removed and the file currently has
   none, which is why the run reports "0 in assets/css/styles.css". It stays
   listed on purpose: the next background or font loaded from CSS should be
   stamped by default rather than by someone remembering this.

   Run before deploying:  node scripts/stamp.mjs        (next number)
                          node scripts/stamp.mjs 7      (a specific one)
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = path.join(ROOT, 'config.js');
/* Everything that carries a ?v=. Add a file here rather than inventing a
   second stamping mechanism for it. */
const STAMPED = [
  path.join(ROOT, 'index.html'),
  path.join(ROOT, 'assets', 'css', 'styles.css'),
];

const config = fs.readFileSync(CONFIG, 'utf8');

const VERSION_RE = /(\bversion:\s*')(\d+)(')/;
const current = Number((config.match(VERSION_RE) || [])[2]);
if (!Number.isFinite(current)) {
  console.error("config.js has no numeric `version:` — can't stamp it");
  process.exit(1);
}

const asked = process.argv[2];
const next = asked === undefined ? current + 1 : Number(asked);
if (!Number.isInteger(next) || next < 1) {
  console.error(`not a build number: ${asked}`);
  process.exit(1);
}

// Every ?v= in every stamped file, whatever it is attached to — the
// stylesheet, the icons and the artwork are all as cacheable as the scripts.
const counts = STAMPED.map((file) => {
  const before = fs.readFileSync(file, 'utf8');
  let n = 0;
  const after = before.replace(/\?v=\d+/g, () => (n++, `?v=${next}`));
  fs.writeFileSync(file, after);
  return `${n} in ${path.relative(ROOT, file)}`;
});

fs.writeFileSync(CONFIG, config.replace(VERSION_RE, `$1${next}$3`));

console.log(`stamped build ${current} → ${next}  (${counts.join(', ')}, 1 version in config.js)`);
