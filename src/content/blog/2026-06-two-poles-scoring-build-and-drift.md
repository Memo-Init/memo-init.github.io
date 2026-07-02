---
title: "Two poles of one ship: scoring what we build, and what we let drift"
description: "A v0.1 milestone — memo-init now scores both the work it is building toward and the work that is quietly going stale, using the same honest, fresh-context measurement for each."
date: 2026-06-22
author: "Memo-Init Team"
tags: [ "release", "goals", "maintenance" ]
---

An AI agent that just did a piece of work will almost always tell you it went well. Ask
the same session whether the feature is finished and you will hear "yes" — because the
session that produced the work is the worst possible judge of it. That blind spot is the
problem this milestone is about. Our answer is to **measure honestly**, and to do it at
both ends of the project at once.

## Why scoring is hard

The hard part of working with coding agents is not getting code written. It is knowing
*how far along you actually are*. A green test run, a "done" report, a closed checklist —
none of them prove the intent behind the work was met. They prove the session believes it
was met. To get an honest reading you need a second opinion from someone who did not do the
work and has no stake in the answer.

## Goals: scoring forward, in a fresh context

A **goal**, for us, is the intent a feature serves over time — "the project has a public
presence online", not "a website exists". Goals outlive any single piece of work.

memo-init scores each goal in a **fresh context**: a separate pass that never ran the
build, distrusts every green report, and goes and looks at the real files before assigning
a number. It reports two things, kept deliberately apart:

- **how far done** the goal is, and
- **how ready it is to act on** — a separate, mechanically counted "is there enough
  grounding here to move autonomously" score.

The result is a worst-first board you can read at a glance, backed by real data on disk.
<!-- snapshot:2026-06 — 13 goal records live in .memo/goals/; live value: `memo goal score-all` -->

## Maintenance: scoring backward, with the same apparatus

Most tooling measures progress. Almost none measures decay. So we built the mirror image
of goal-scoring and pointed it the other way.

A **maintenance card** is one card per repository that tracks how current that repo still
is against the source it was pinned to — its *freshness* — plus a *blast radius* for how
much depends on it. Same idea as goals, same fresh-context honesty, aimed at the stern
instead of the bow.
<!-- snapshot:2026-06 — 6 maintenance cards live in .memo/maintenance/; live value: `memo maintenance score-all` -->

It watches drift in two directions, and the second one is the one most tools miss:

- **The world drifts** — a pinned source moves on, and your copy is now behind. This is
  loud; something stops matching.
- **The model improves** — a better approach arrives, nothing breaks, so nothing signals.
  This drift is quiet, and it is exactly the kind that accumulates unnoticed.

## One ship, two poles

It helps to picture a ship. The bow splits the water as it moves forward — that is
goal-scoring, the new build-out. The stern trails behind, dragging through the wake of work
already delivered — that is maintenance, the slow drift. It is a useful image for why the
two belong together, not a precise model: the point is simply that a project has both a
front edge and a back edge, and both deserve to be measured with the same honesty.

## What does not change

Two rules hold for both poles. Scoring **never** runs in the session that produced the
work — honesty depends on the distance. And maintenance **never deletes**: a stale edge is
flagged and, once genuinely re-checked, re-blessed, but nothing is removed on the
scorecard's say-so.

## Where to read it

- **[The specification](/specification/overview/)** — the goals and maintenance chapters
  describe the scoring model, the two axes, and the gated re-bless in full.
- **[GitHub organization](https://github.com/memo-init)** — the spec and its tooling,
  developed in the open under the MIT license.

memo-init is still at version 0.1 and marked as a draft. This milestone is less about a new
feature and more about a posture: the release where the project learned to take an honest
measurement of itself — forward and backward at once.
