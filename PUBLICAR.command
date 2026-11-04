#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
test -f LEEME-V110.md
test -f normas.html
test -f original-avatar-layers.js
node --check casting-game.js
node --check hunger-page.js
node --check avatar-art.js
npx wrangler pages deploy . --project-name tengaged-reborns
