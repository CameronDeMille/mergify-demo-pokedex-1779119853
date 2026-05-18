# Mergify Demo Plan — Pokedex Pull-Stack

A repeatable, shareable demo that walks engineers through Mergify's **merge queue** and **Stacks** features in a single 25–30 minute talk, using Claude Code to author a stacked PR set live.

---

## 1. Goals

- **Audience:** engineers (an adoption pitch — convince devs to use Mergify daily).
- **Outcome we want:** after the talk, a viewer can answer "what does Mergify give me that branch protection + auto-merge don't?" and can run the demo themselves.
- **Time:** 25–30 min talk + ~10 min Q&A.
- **Surface:** terminal + browser only. No slides.
- **Repeatability:** anyone can clone the template and run `bootstrap.sh` to spin up an identical demo in their own GitHub account.

## 2. Scope (what's in, what's out)

**In:**
- Merge queue with required CI checks (the flagship).
- Mergify Stacks (the CLI workflow shown in the docs page that triggered this demo).
- The Claude Code + Stacks skill integration (so the stack is produced live by an AI coding agent — this is the "novel beat" of the talk).
- One bot command moment (`@mergify rebase`).

**Out (mentioned only as "also available" in the close):**
- Backports / Copy.
- CI Insights / flaky test analytics dashboards.
- Priority queues, batched merging, advanced rule trees.
- Private-repo features.

## 3. The Demo Application

A **Pokedex viewer** with a favorites feature.

### 3.1 Repo layout (pnpm monorepo)

```
mergify-demo-pokedex/
  apps/
    api/         # Hono or Express, Vitest
    web/         # Next.js (app router), minimal styling
  packages/
    types/       # shared Pokemon + User types — the seat of the semantic conflict
  data/
    pokemon.json # bundled first-gen 151
  .github/
    workflows/ci.yml
  .mergify.yml
  bootstrap.sh
  README.md      # self-runner walkthrough
  package.json   # pnpm workspace root
  pnpm-workspace.yaml
```

### 3.2 Why these choices
- **Bundled JSON, not PokeAPI:** deterministic. Test failures are ones we plant, not network noise.
- **Backend + frontend:** richer surface for CI to gate; visually compelling. The semantic conflict between `apps/web` and `apps/api` via `packages/types` is the kind of bug stacked PRs make legible.
- **First-gen 151:** legible and small; no licensing concerns for a demo.

## 4. The Stack — three PRs

Each PR is a vertical slice. The stack is `PR1 ← PR2 ← PR3` (PR3 depends on PR2 depends on PR1).

| PR | Title | Touches | Planted Failure |
|----|-------|---------|-----------------|
| **PR1** | Add Pokemon data model and API data layer | `packages/types`, `apps/api/src/data/*`, `apps/api/test/*` | **Flaky test** — a `Date.now()`-dependent test in `apps/api/test/data.spec.ts` that fails ~30% of runs. Shows queue retry behavior. |
| **PR2** | Add paginated list endpoint and web list page | `apps/api/src/routes/list.ts`, `apps/web/app/page.tsx`, tests | **Lint/type error** — an unused import in `list.ts` that ESLint flags as `error`. Shows fix-and-restack via `mergify stack push`. |
| **PR3** | Add favorites endpoint, auth middleware, and favorite button | `packages/types` (adds `ownerId` to `Pokemon`), `apps/api/src/middleware/auth.ts`, `apps/api/src/routes/favorites.ts`, `apps/web/components/FavoriteButton.tsx` | **Semantic conflict with PR2** — PR3 changes `Pokemon` type to include `ownerId`. PR2's `app/page.tsx` does `pokemon.id` lookups assuming the old shape. Once PR2 merges and PR3 rebases on top, the type drift surfaces as a typecheck failure that needs a one-line fix in PR3. This is the moment that proves "stacks aren't free — but they're tractable." |

### 4.1 Planted-failure details

**Flaky test (PR1):**
```ts
// apps/api/test/data.spec.ts — DEMO PLANT, do not "fix" it
it("sorts by id deterministically", () => {
  const seed = Date.now() % 10;
  expect(sortPokemon(samples, seed > 6 ? "asc" : "id")).toEqual(expected); // ~30% fail rate
});
```
Mergify queue retries on transient CI failure; we let it retry once on stage.

**Lint error (PR2):**
```ts
// apps/api/src/routes/list.ts
import { Pokemon, type FavoriteRecord } from "@pokedex/types"; // unused — eslint(no-unused-vars): error
```
Live fix: remove the import, `mergify stack push`, then `@mergify rebase` PR2 in the GitHub UI.

**Semantic conflict (PR3 after PR2 merges):**
- PR2 ships `apps/web/app/page.tsx` with `<li key={p.id}>{p.name}</li>`.
- PR3 adds `ownerId: string` as a *required* field on `Pokemon` in `packages/types`.
- Once PR2 merges and PR3 rebases, `packages/types/index.ts` now demands `ownerId` everywhere; `apps/web/app/page.tsx` builds a `Pokemon[]` array from the API response without that field → typecheck fails on PR3.
- Fix: make `ownerId` optional, or filter it server-side. One-line change, but the audience sees that **the conflict wasn't visible until the stack rebased**.

## 5. CI workflow

`.github/workflows/ci.yml` — one workflow, parallel jobs:

| Job | What it runs | What it gates |
|-----|--------------|---------------|
| `typecheck` | `pnpm typecheck` | Catches the semantic conflict on PR3. |
| `lint` | `pnpm lint` | Catches the planted lint error on PR2. |
| `test:api` | `pnpm --filter api test` | Where the flaky test lives. |
| `test:web` | `pnpm --filter web test` | Smoke test for the page. |
| `build` | `pnpm build` | Production build of both apps. |

All five are listed as required checks in `.mergify.yml`'s queue rules.

## 6. Mergify config (`.mergify.yml`)

Minimum viable interesting config. Walks in ~90 seconds.

```yaml
queue_rules:
  - name: default
    # Retry once on flaky CI — Mergify recreates the draft PR for a fresh run.
    # This is what makes the planted flaky test on PR1 self-heal on stage.
    max_checks_retries: 1
    queue_conditions:
      - check-success=typecheck
      - check-success=lint
      - check-success=test:api
      - check-success=test:web
      - check-success=build
    merge_conditions:
      - check-success=typecheck
      - check-success=lint
      - check-success=test:api
      - check-success=test:web
      - check-success=build
    merge_method: squash
```

**Activation is via the `@mergifyio queue` command, not labels.** We deliberately do NOT include a `pull_request_rules` auto-queue block or `merge_protections_settings.auto_merge_conditions`. Rationale:

- The flagship demo beat is *"comment `@mergifyio queue` on the top PR of a stack and watch the whole stack land bottom-up"* — per the Mergify Stacks docs. An auto-trigger would steal that moment.
- It also gives us multiple natural bot-command beats throughout Act 3 (queue, dequeue on failure, re-queue after fix).
- In the close, mention that `merge_protections_settings.auto_merge_conditions: true` is the one-line config for teams that want PRs auto-queued on label/approval/CI-green. (Note: `autoqueue` is deprecated and removed in mid-2026 — don't use it.)

**Note on approvals:** approval requirement was intentionally dropped (solo personal account; no second reviewer). The queue only waits on CI green. In the close, mention that adding `#approved-reviews-by>=1` is a one-line change for teams with reviewers.

**Compatibility gotcha:** GitHub's *native* merge queue ruleset (rule type `merge_queue`) is mutually exclusive with Mergify's queue — if it's enabled on the target branch and Mergify isn't a bypass actor, GitHub blocks Mergify from merging. The bootstrap checklist includes verifying this is off.

## 7. Demo runbook

Total: ~28 minutes live + ~10 min Q&A.

### Act 0 — Setup (off-stage, before the talk)
- `bootstrap.sh` already run; repo `mergify-demo-pokedex` exists in your personal account.
- Mergify GitHub App installed and scoped to that repo.
- Pre-recorded fallback clip queued in a hidden tab.
- `demo-final` branch already pushed with the completed stack merged (full backstop).
- A terminal open in the repo root. A browser with three tabs: repo home, Actions, and Mergify dashboard.

### Act 1 — Frame the problem (3 min)
- Open the repo on GitHub. Show `main` is clean.
- Say: *"I'm going to add a feature — paginated Pokemon list with a favorites button. The lazy version is one giant PR. The right version is three small ones. Watch."*
- Show the `.mergify.yml` and `ci.yml` in your editor. ~30 seconds each. Frame: "this is the entire Mergify surface for today's demo."

### Act 2 — Claude Code makes a stack (8 min, LIVE)
- Open Claude Code in the repo. Confirm the `mergify-stack` skill is installed (`/plugin list`).
- Paste the demo prompt (see Appendix A). It instructs Claude to plan a 3-PR stack matching the table in §4 and execute it.
- Claude reads code, makes 3 commits each with a `Change-Id`, runs `mergify stack push`.
- 3 PRs appear on GitHub, linked top-to-bottom. **This is the wow moment.**
- *Fallback:* if Claude stalls or refuses, hotkey to the pre-recorded clip and narrate over it.

### Act 3 — The queue takes over (13 min)

**Opening beat (~1 min):** Open PR3 on GitHub. Point at the **stack map comment Mergify auto-posted** — it lists all three PRs with links and shows where this one sits in the chain. Same comment on PR1 and PR2. *"You didn't write this. Mergify did, the moment the stack was pushed."*

**Then the magic moment (~30 sec):**

> *"One PR-per-PR queueing is annoying. Watch this."*

Type `@mergifyio queue` as a comment on PR3 (top of stack). Submit.

Mergify recognizes the stack via the `Depends-On:` markers in the PR bodies and **enqueues all three PRs at once, bottom-up**. From here, you mostly narrate while the queue works.

1. **PR1 enters validation (~3 min).** Tab over to a terminal: `mergify queue status` shows PR1 at the head, PR2 and PR3 queued behind it. CI runs the 5 parallel jobs. The flaky test fails. Because `max_checks_retries: 1` is set, **Mergify recreates the draft PR and retries automatically — no human action.** Show this on the dashboard (one browser flip — the only one). On retry, CI green. PR1 squash-merges into `main`.

2. **PR2 fails validation: the lint error (~5 min).** PR2 reaches the head of the queue. Lint job fails on the unused import. Mergify dequeues PR2 (and PR3 cascades out — it depends on PR2). Now the two beats:

   - **Comment-persistence beat (~30 sec):** Before fixing, navigate to the offending line in PR2's diff on GitHub. Leave a review comment: *"unused import — remove."* Submit the review. This is so the audience sees the comment is yours, on this specific line, on this specific commit SHA.
   - **Fix and restack (~2 min):** In your editor, remove the import in `apps/api/src/routes/list.ts`. `git add && git commit --amend`. `mergify stack push`. The remote branch force-updates; the PR shows a new commit. Switch back to GitHub PR2 — **your review comment is still attached to the same line of the new commit.** *"That's Mergify keeping review threads alive across the force-push."*
   - **Bot-command beat (~30 sec):** Comment `@mergifyio queue` on PR3 (top) again. PR2 and PR3 re-enter the queue. CI green on PR2. Squash-merges.

3. **PR3 fails validation: the semantic conflict (~3 min).** PR3 now rebases on the new `main` (which has PR2's list page). Typecheck fails — `ownerId` was added as a required field in `packages/types`, but PR2's `apps/web/app/page.tsx` constructs Pokemon objects without it. **Show the diff. This is the conflict the audience cares about: git couldn't see it, but the stack rebase did.** One-line fix: make `ownerId?: string` optional. `git commit --amend`, `mergify stack push`, `@mergifyio queue` on PR3 one more time. CI green. Merges. Stack complete.

   Run `mergify stack list` in the terminal — empty. The stack is gone because it's all on `main`.

### Act 4 — Close (5 min)
- Tab to `main`: all three features shipped, history is three squash commits.
- Recap: *"What did Mergify do? Serialized merges so we never broke main. Auto-retried a flake. Auto-rebased the stack as each PR landed. Kept review comments attached across a force-push. Surfaced a semantic conflict at the right moment. And a coding agent produced the whole stack via a one-line skill install."*
- **Mention what was deliberately not shown** (one-liner each, in case anyone asks):
  - **Auto-merge:** `merge_protections_settings.auto_merge_conditions` for teams that don't want to type `@mergifyio queue`.
  - **Approvals:** add `#approved-reviews-by>=1` to `merge_conditions` for teams with reviewers.
  - **Two-step CI:** split fast checks into `queue_conditions` and slow ones into `merge_conditions` to cut CI bill.
  - **Parallel scopes:** for monorepos where PRs touch independent services — `mode: parallel` plus a `scopes:` block.
  - **Priority queues:** a second queue with `queue_conditions: [label = urgent]` for hotfixes that jump the line.
  - **Browser extension:** Chrome/Firefox toolbar with a one-click queue button on the GitHub PR page.
  - **Backports, CI Insights, private-repo features:** point at `docs.mergify.com`.
- Show the README: *"This whole demo is a template repo. Run `./bootstrap.sh` in your own account and you've got it."*
- Q&A.

## 8. Fallback plan

| Failure mode | Recovery |
|--------------|----------|
| Claude refuses or stalls > 30s in Act 2 | Hotkey to pre-recorded "Claude makes the stack" clip (~3 min, screen-captured + sped up). Narrate over it. Resume Act 3 live. |
| Mergify queue hangs / doesn't pick up a PR | Comment `@mergifyio refresh` on the PR. If still stuck after 60s, comment `@mergifyio queue` again on the top PR. If still stuck, switch to `demo-final` branch and walk through the already-merged state, narrating "here's what would have happened." |
| Mergify says the PRs aren't recognized as a stack (no `Depends-On:` markers) | Caused by Claude pushing via `git push` instead of `mergify stack push`. Run `mergify stack push` yourself in the terminal to re-publish. If that fails, switch to `demo-final`. |
| CI provider down (GitHub Actions outage) | Switch to `demo-final`. Run nothing live. |
| Network/wifi dies | Have a phone hotspot ready. If still down, switch to `demo-final` (it has the full history on disk, you can show locally). |

The `demo-final` branch is the universal backstop: it has the three squash commits already on `main` and the merged PR pages still viewable in the GitHub UI.

## 9. Bootstrap script — what `bootstrap.sh` does

```bash
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

✓ Repo created and cloned.
✓ Dependencies installed.
✓ Mergify Stacks initialized (commit-msg + pre-push hooks active).
✓ Browser opened to Mergify GitHub App install.

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
```

## 10. Self-runner `README.md` (outline, ~200 lines)

Sections, in order:

1. **What this is** (one paragraph + a screenshot of the final `main` history).
2. **What you'll learn** (3 bullets: queue, stacks, AI-agent + stacks integration).
3. **Prereqs** (gh CLI, pnpm, uv, a GitHub account, Claude Code or Cursor).
4. **One-line setup:** `curl -fsSL https://raw.githubusercontent.com/.../bootstrap.sh | bash`. Plus the manual steps the script prints.
5. **Walkthrough — Act 2:** "Now ask Claude Code to build the stack" (the prompt from Appendix A goes here verbatim). What to look for on the GitHub PRs page — especially the auto-posted stack map comment.
6. **Walkthrough — Act 3:** "Comment `@mergifyio queue` on the top PR (PR3). The whole stack enqueues bottom-up. Open a terminal and run `mergify queue status` and `mergify stack list` to see what's happening." Walk through each planted failure and the fix-and-restack flow. Mirror the runbook beats with screenshots.
7. **Reset for next demo:** `gh repo delete --yes && ./bootstrap.sh`.
8. **Where to go next:** links to Mergify docs sections on backports, priority queues, Insights.

## 11. Build TODOs

Numbered so a future session (Claude Code or you) can pick this up and ship it.

1. **Create the template repo.** `gh repo create mergify-demo-pokedex-template --public --template-flag`. Initial commit: empty pnpm monorepo skeleton.
2. **Scaffold `apps/api`** with Hono + Vitest. Single GET /pokemon endpoint returning bundled data.
3. **Scaffold `apps/web`** with Next.js app router. Single page that fetches from the api at build time.
4. **Scaffold `packages/types`** with a single `Pokemon` interface (no `ownerId` yet — that's PR3's plant).
5. **Drop in `data/pokemon.json`** (first-gen 151; trim from PokeAPI once, commit static).
6. **Write `.github/workflows/ci.yml`** with the five parallel jobs from §5.
7. **Write `.mergify.yml`** from §6. Include `max_checks_retries: 1`. Do NOT include a `pull_request_rules` auto-queue block or `auto_merge_conditions`. Do NOT use the deprecated `autoqueue` key.
8. **Write the planted-failure-free baseline** so `main` is green on its own. The plants only appear *in the stack PRs Claude creates*, not in the template.
9. **Write `bootstrap.sh`** per §9.
10. **Write `README.md`** per §10.
11. **Record the fallback clip:** run the demo end-to-end at least twice; capture the Claude-Code-makes-a-stack segment on the second run.
12. **Create the `demo-final` branch:** run the demo successfully once, then `git checkout -b demo-final && git push`. This branch has the finished history.
12a. **Setup-time check:** verify the template repo has NO `merge_queue` GitHub ruleset on `main`. Document this in the README's "first run" section.
13. **Dry-run the talk twice end-to-end** with a timer. Adjust the runbook timing.
14. **Write speaker notes** as a short cheat sheet (filename: `SPEAKER_NOTES.md` — one screen, just the act timings and the recovery hotkeys).

---

## Appendix A — The Claude Code prompt (live agent moment)

This is the prompt pasted into Claude Code on stage in Act 2. It assumes the `mergify-stack` skill is already installed.

```
You're working in a pnpm monorepo: apps/api (Hono), apps/web (Next.js),
packages/types. The repo currently exposes GET /pokemon returning bundled
first-gen 151 data.

Add three features as a STACKED set of pull requests, using the Mergify
Stacks workflow you have a skill for. Each PR must be independently
reviewable. Use `mergify stack push` to publish.

Stack contents (top of stack = PR3, bottom = PR1):

PR1: Pokemon data model + API data layer + tests.
  - Add Pokemon type to packages/types.
  - Add a data-loading layer in apps/api/src/data/ with a sort helper.
  - Cover with Vitest. Include this exact test verbatim — do not modify
    or "fix" it; it's intentional:

      it("sorts by id deterministically", () => {
        const seed = Date.now() % 10;
        expect(sortPokemon(samples, seed > 6 ? "asc" : "id")).toEqual(expected);
      });

PR2: Paginated list endpoint + web list page.
  - Add GET /pokemon?page=&pageSize= to apps/api.
  - Render the list at apps/web/app/page.tsx with a "next page" link.
  - In apps/api/src/routes/list.ts, include this exact import line verbatim;
    do not remove it:

      import { Pokemon, type FavoriteRecord } from "@pokedex/types";

PR3: Favorites endpoint + auth middleware + web favorite button.
  - Add `ownerId: string` as a REQUIRED field on the Pokemon type in
    packages/types. Do not make it optional.
  - Add a minimal bearer-token auth middleware in apps/api.
  - Add POST /favorites (auth-required) and GET /favorites/:userId.
  - Add a <FavoriteButton/> component in apps/web that calls POST /favorites.

Constraints:
- Each PR must build on its own once its parent is merged. The intentional
  plants above are demonstrations of real-world failure modes; leave them in.
- Use conventional commits.
- Title each PR clearly so a reviewer knows the slice.
- After pushing, comment back with the three PR URLs.
```

The "do not fix" / "do not remove" / "do not make it optional" clauses are load-bearing — they're how we keep the planted failures in despite Claude's instinct to clean up.

---

## Decisions log (for future-you)

| Decision | Choice | Reason |
|----------|--------|--------|
| Audience | Engineers — adoption pitch | Drives hands-on, technical tone. |
| Scope | Queue + Stacks (agents/backports skipped) | Matches the docs page that triggered this; novel + flagship together. |
| Time | 25–30 min + 10 min Q&A | Both features need ~8 min each; rest is framing. |
| App | Pokedex viewer + favorites | Universally legible; favorites justifies auth in PR3. |
| Data | Bundled JSON, 151 first-gen | Deterministic CI; no network in tests. |
| Repo | pnpm monorepo (api, web, types) | Shared types is the seat of the semantic conflict. |
| Approval rule | Dropped | Solo personal account; mention as a one-line add in the close. |
| Bot command beat | `@mergifyio queue` used 3+ times naturally (initial enqueue + 2 re-queues after fixes) | Replaces the original "one `@mergify rebase`" idea — the queue command is the canonical Mergify UX and re-queueing after a failure is the natural beat. |
| Presentation | Terminal + browser, no slides | Adoption pitch; demo is the meat. |
| Fallback | Pre-recorded Claude clip + `demo-final` branch | Two backstops, no full troubleshooting doc. |
| Hosting | Personal GitHub, public repo, Mergify free tier | $0; mention enterprise tier exists. |
| Reset | `bootstrap.sh` deletes + recreates from template | ~30s per reset; bulletproof. |
| Stack activation | Manual `@mergifyio queue` on top PR (single command enqueues whole stack bottom-up) | Per Mergify Stacks docs; this is the headline beat — one command, three PRs land in order. Auto-queue config (`auto_merge_conditions`) intentionally omitted so this stays a deliberate, observable action. |
| Flake handling | `max_checks_retries: 1` in queue rule | Makes the queue-retry story automatic and visible on stage — no manual `@mergifyio queue` after the flake. |
| Monitoring during demo | CLI-first (`mergify queue status`, `mergify stack list`) + one dashboard browser flip | Fits the "terminal + browser, no slides" presentation. Dashboard appears once to show the visual retry. |
| GitHub native merge queue | Must be OFF on the demo repo | Mergify's queue is mutually exclusive with GitHub's `merge_queue` ruleset unless Mergify is a bypass actor. Verified in bootstrap checklist. |
