---
title: "From a voice note to a chronicle: the life of a topic"
description: "A v0.1 milestone — how a spoken idea travels through memo-init as a single thread, from a raw transcript to a narrated history entry, with the topic as the connecting tissue the whole way."
date: 2026-06-22
author: "Memo-Init Team"
tags: [ "release", "chronicle", "transcripts" ]
---

A lot of planning starts as a voice note — a long, messy, spoken brain-dump. The trouble
is everything that can happen to an idea between "spoken out loud" and "written down
correctly": a word is mis-heard, a point gets summarized away, the reasoning is lost and
has to be guessed at later. This milestone is about giving an idea a single, traceable
life — so the thread that starts in a voice note is still visible in the project's history
months later.

## Why a thread is hard to keep

Hand an agent a transcript and ask it to "summarize and proceed", and the first casualty is
context. The second is fidelity: a mis-heard term quietly becomes a decision nobody made.
And once work is done, the record of *why* it happened tends to evaporate. We wanted one
object that survives all three stages — and the answer turned out to be the **topic**.

## The life of a topic

A **topic** is just one point from the input — one problem, one decision, one thing to do.
Here is the path it travels:

1. **A raw voice note arrives.** Before anything is read into it, the transcript is scored
   for **reliability** and cleaned against a shared **dictionary** of known mis-hearings.
   The rule behind this is strict: a transcript is raw machine output, so an odd spelling
   is treated as a transcription error to confirm — *never* as a decision the speaker made.
2. **It is broken into topics.** Every distinct point becomes a registered topic. Nothing
   is too small to list; the topic list is the checklist for everything that follows.
3. **The topics drive the memo.** The planning document — the memo — is built from them.
   Each topic is a thread the memo has to address.
4. **The chronicle carries them onward.** When the memo is finished, a single narrated
   entry is appended to the project **chronicle** — and that entry carries the same topics
   forward, each with a short note and a rough completion estimate.

So the topic is the connective tissue: the same unit named in the voice note is the one
scored in the transcript, tracked through the memo, and still listed in the history entry
at the end.
<!-- snapshot:2026-06 — chronicle kept in .memo/chronic/ (4 files so far); live value: `memo chronic` -->

## The chronicle narrates — it does not grade

One distinction matters. The chronicle is a *narrator*, not a judge. It tells the story —
"we did this, then that, and gave up on the other" — and it marks **breakpoints**, the
moments where the direction actually changed. It deliberately does not score anything;
honest scoring is a separate job (and a separate story). Keeping the two apart is what lets
the chronicle stay a plain, readable account instead of a dashboard.

## What does not change

The transcript is always treated as untrusted machine text: a strange word is questioned,
not adopted. And the chronicle only ever grows — entries are appended, never rewritten, so
the history stays honest about what was believed at the time.

## Where to read it

- **[The Memo specification](/memo/overview/)** — the chapters on the input pipeline,
  topics, and the chronicle describe each stage and how they connect.
- **[GitHub organization](https://github.com/memo-init)** — the spec and its tooling, in
  the open under the MIT license.

memo-init is still at version 0.1 and marked as a draft. This milestone did not add a big
feature so much as finish a thread — letting a single idea keep its identity from the first
spoken word to the last line of the history.
