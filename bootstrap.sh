#!/usr/bin/env bash
set -euo pipefail

REPO_NAME="${1:-mergify-demo-pokedex-$(date +%s)}"

# 1. Create repo from this template under the current gh user
gh repo create "$REPO_NAME" --template "$TEMPLATE_OWNER/mergify-demo-pokedex-template" --public --clone
cd "$REPO_NAME"

# 2. Install deps
pnpm install

# 3. Install Mergify CLI if missing, then init stacks
command -v mergify >/dev/null || uv tool install mergify-cli
mergify stack setup

# 4. Open Mergify GitHub App install page (manual click required)
open "https://github.com/apps/mergify/installations/new" 2>/dev/null || xdg-open "https://github.com/apps/mergify/installations/new"

# 5. Print the remaining manual checklist
cat <<'EOF'

Repo created and cloned.
Dependencies installed.
Mergify Stacks initialized (commit-msg + pre-push hooks active).
Browser opened to Mergify GitHub App install.

NEXT (manual steps):
  1. In the browser tab that just opened, install the Mergify GitHub App
     and scope it to this new repo.
  2. Verify on https://dashboard.mergify.com that the repo appears.
  3. Check Settings > Rules > Rulesets: make sure NO ruleset of type
     "merge_queue" (GitHub's native merge queue) is enabled on `main`.
     If one exists, disable it or add Mergify as a bypass actor with
     "always" mode. Otherwise Mergify cannot merge.
  4. Open the repo in your editor: code .
  5. Open Claude Code in the repo: /plugin install mergify-stack@mergify
  6. You're ready. See README.md for the demo walkthrough.

EOF
