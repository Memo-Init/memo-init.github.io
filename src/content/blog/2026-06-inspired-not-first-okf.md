---
title: "Inspired, not first: adopting Google's Open Knowledge Format"
description: "A v0.1 milestone — when Google Cloud published the Open Knowledge Format, our project wiki was already close to it. Here is how we adopted the standard additively, and a second, less obvious place we use it."
date: 2026-06-22
author: "Memo-Init Team"
tags: [ "release", "okf", "knowledge-graph" ]
---

In June 2026, Google Cloud published the **Open Knowledge Format (OKF)** — an open
specification for describing knowledge as a plain folder of Markdown files. When a standard
you have been quietly building toward gets published by someone much bigger, there is a
boastful way to tell that story and an honest one. The honest one is more interesting, and
it is the one that is actually true: we were inspired by the same idea, we had been building
in the same direction, and the standard arriving made our own work easier rather than
obsolete.

## What OKF is

OKF is, in its own words, "just Markdown with YAML frontmatter". A knowledge bundle is a
directory of `.md` files; each file is one concept with a short YAML header whose only
required field is `type`, and the files are linked into a portable graph by ordinary
Markdown links — no SDK, no database. It is permissive by design: a reader tolerates
missing fields and broken links rather than rejecting the bundle.

OKF does not claim to invent the idea. It explicitly **formalizes Andrej Karpathy's
"LLM-wiki" pattern** — the practice of letting a language model maintain a cross-linked
Markdown wiki. Google's contribution was to wrap that practice in a small, shared set of
conventions so different tools can read the same bundle. So the lineage is honest and
worth stating plainly: *Karpathy described the pattern, Google gave it a form, and we were
already on that path.*

## How we adopted it

Our project wiki was, it turned out, already a near-superset of OKF. That made adoption
**additive** rather than a rewrite:

- We declared conformance and made three small alignments (a frontmatter-free index file,
  a stated link convention, a version marker).
- We gave up **nothing**. Our richer fields — source provenance, status, timestamps —
  simply survive as OKF *extension keys*, which the spec explicitly tells consumers to
  preserve.
- A small linter keeps the bundle strictly conformant from the inside, while the bundle
  stays permissively readable from the outside.

That is the whole story of the migration, and it is a quietly reassuring one: when a good
external standard converges with what you already built, you do not start over — you mostly
just say so.

## A second, less obvious use

OKF is aimed at giving AI agents curated data context. We use the same mechanics for
something different: describing **our own architecture** as a checkable graph. The intended
structure of our repositories is written as an OKF bundle — one node per repository, the
dependencies between them as edges, each edge stamped with the exact commit it was last
verified against. That graph is not documentation for its own sake; a maintenance check
reads it to tell whether the real code has drifted from the architecture it is supposed to
have.

So the same humble format does two jobs for us: it makes our knowledge wiki interoperable,
and it turns our architecture into something a tool can hold accountable.

## Where to read it

- **[Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog)** —
  the specification and reference tools, published by Google Cloud under Apache-2.0.
- **[The specification](/specification/overview/)** — the chapter on our knowledge format
  describes the conformance and the architecture-graph use in full.

memo-init is still at version 0.1 and marked as a draft. We are not claiming a first here —
only that we try to build toward good ideas early, and that when the wider ecosystem names
one of them, we are glad to speak the same language.
