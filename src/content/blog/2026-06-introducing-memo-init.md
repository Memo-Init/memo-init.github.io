---
title: "Introducing Memo-Init"
description: "Memo-Init is an open, RFC-style specification for memo-driven, agentic software engineering — plan first, then let AI agents implement against a versioned strategy document."
date: 2026-06-11
author: "Memo-Init Team"
tags: [ "announcement" ]
featured: true
---

AI coding agents are fast. Give one a vague instruction and it will produce a lot of
code — quickly, confidently, and sometimes in entirely the wrong direction. The hard
part of agentic software engineering is not code generation. It is making sure the
human and the machine agree on *what to build* before any code exists.

Memo-Init is our answer to that problem: an open specification for **memo-driven
development**.

## The core idea

A **memo** is a versioned strategy document. It captures a feature idea — often
starting from nothing more than a dictated voice note — and turns it into a precise,
reviewable plan before implementation begins:

1. **Capture.** Long, unstructured input (a voice transcript, a brain dump) is
   processed into a first structured draft.
2. **Iterate.** The memo evolves through explicit revisions. Open questions are
   collected and answered by the developer — before implementation, not during it.
3. **Finalize.** A quality gate checks the memo for gaps, contradictions, and
   unverified assumptions. Only then is it frozen.
4. **Roll out.** The finalized memo is broken down into small, self-contained work
   orders that AI agents execute autonomously — each result validated against the
   memo it came from.

The division of labor is deliberate: **the developer plans, the AI implements.**
The memo is the single highest authority over its own rollout. If the generated
code and the memo ever disagree, the memo wins.

## Why publish it as a specification?

Memo-Init is written in the normative style of an RFC (MUST / SHOULD / MAY). It is
*inductive*: reverse-engineered from a real, working system rather than designed on
a whiteboard. Guardrails come first — plan before you build, keep context clean,
never delete, always leave an audit trail.

Writing the rules down as a spec makes them portable. The workflow is not tied to
one editor, one vendor, or one project — anyone building with AI agents can adopt
the parts that fit.

## Explore it today

- **[The specification](/specification/overview/)** — all chapters, from the input
  pipeline to rollout and quality gates.
- **[GitHub organization](https://github.com/memo-init)** — the spec and its tooling,
  developed in the open under the MIT license.
- **[llms.txt](/llms.txt)** — the complete specification in a single machine-readable
  file, ready to drop into an AI agent's context.

Memo-Init is young: the specification is at version 0.1.0 and marked as a draft.
If structured human-AI collaboration is something you are thinking about, we would
love for you to read along — and tell us where the spec falls short.
