# Blog Convention

How we write release/feature posts for the memo-init blog. This file is internal (it is
not part of `src/content/`, so Astro does not publish it). The posts themselves live in
`src/content/blog/` and are validated by the `blog` collection in `src/content.config.ts`.

## Cadence

Event-driven, not calendar-driven: **one post per shipped milestone.** When a real
feature lands, it gets a post; we do not post on a schedule. A "release" post introduces a
group of related changes; a "feature" post covers a single capability.

## Post skeleton

Every post follows the same beats (not all are mandatory, but this is the spine):

1. **Lede / hook** — the problem, then in 2–3 sentences what this change is at its core.
2. **Why?** — what was hard before, with a concrete example.
3. **The change** — the actual new thing, with copyable code/`mermaid` where it helps;
   for a break, an explicit *Before / Now*.
4. **What does not change** — a short paragraph that heads off misreadings. Especially
   important for a young project.
5. **Where to read it** — deep links into the spec/docs. No aggressive sign-up CTA.
6. *(optional)* "What's new" bullets · "What's next" with open questions named as open.

## Frontmatter

Schema lives in `src/content.config.ts` (Astro 5). Fields:

```yaml
title:       string      # required
description: string      # required — one dense sentence (SEO/teaser)
date:        YYYY-MM-DD   # required
author:      string      # default "Memo-Init Team"
tags:        [string]     # first tag is the category: release / tooling / process
draft:       boolean     # default false
featured:    boolean     # optional — single-source highlight (one post at a time)
```

## Language

**English only.** The blog follows the workbench language matrix (docs outside memos are
English). There is no German mirror.

## Release naming

memo-init has no classic product version (the spec is v0.1, mostly draft). So posts are
**milestone notes**, not version announcements — no invented `v0.1.x` numbers. The honest
frame is "what we are building in the open", not "stable v1 launch".

## Tone (three guardrails)

1. **Human, but honest.** Narrative, first person plural ("we"), problem-first. State
   facts plainly and cite them; mark estimates as estimates. Evidence discipline is the
   trust signal, and it costs no warmth.
2. **Outward-facing.** Write for a new visitor with no project context. Do not narrate the
   internal process; do not assume insider knowledge. Explain a term (goal, maintenance
   card, chronicle, OKF) before using it. This rule wins over narrative depth when they
   conflict. Anti-pattern: opening a post with an internal reference or process jargon.
3. **Humble, not boastful.** No superiority claims. Where we are good, say it with "and",
   not "better than". Big claims attract negativity; convergence with prior art is told as
   convergence, not as a race we won.

## Time-bound numbers

Wrap any point-in-time number (test counts, goal counts, …) in a snapshot comment so it is
obvious when it was true and where the live value lives:

```html
<!-- snapshot:2026-06 — 450 tests green; live value: repos/core `node --test` -->
```

## Honesty about scope

Never announce planned-but-unshipped work as shipped. Only write about what is genuinely
released and verifiable.
