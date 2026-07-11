---
title: "Controlled Vocabulary for LLMs: reference, not repetition"
description: "Write for LLMs at scale and one term drifts to different meanings across files. The fix is old and simple: define each term once, reference it everywhere. Plain JSON is enough."
date: 2026-07-11
author: "a6b8"
tags: [ "llm", "specifications", "controlled-vocabulary", "skos" ]
draft: false
---

Write for LLMs at any scale and the same term ends up in dozens of files. Slowly and quietly, it starts to mean slightly different things in different places. That drift is the real problem: the model reads two definitions of one word and picks one at random. The fix is old and simple — define each term in one place, point at it everywhere else. Plain JSON is enough. You do not need the semantic web.

## The real problem is drift

Your terms live in many files. Prompts, specs, agent instructions, docs. The same word appears in dozens of places, and over time it stops meaning the same thing everywhere.

That is drift, and it is the failure that hurts. One prompt calls a background job an "agent." Another reserves "agent" for the top-level planner. Both feel right in place. Read together, they teach the model two meanings for one word, and it picks one at random per call. Nobody decided this. It accumulates on its own.

Drift has a louder cousin: blast radius. Change one term's meaning and you have to hunt down every copy; miss one and the model reads a stale definition. That one at least announces itself. Drift is silent, which is why it is the one worth designing against.

Both problems are old. Software configuration met them decades ago and answered with one idea: reference, not repetition. Define a thing once. Point at it from everywhere else.

## Two standards, two layers

Two public standards already solve the two halves of this. I took one idea from each, and they sit at different layers.

**SKOS** comes from library science — it is the W3C vocabulary standard ([reference](https://www.w3.org/TR/skos-reference/)). It answers what goes in an entry: a preferred label, a definition, and a scope note. The scope note is where "what it is not" lives. SKOS is the content model — the practical shape of a single term.

**OASF**, the Open Agentic Schema Framework, comes from the agent world. It answers how the entry behaves over time: a stable identifier that never changes, a human label that can, a version, and a list of known wrong labels. The identifier is the anchor; the label is cosmetic and swappable; the version is SemVer, so a meaning change shows up in the number; known mislabels catch the common confusions on purpose. OASF is the mechanism — the architecture around the term.

One is the practical content model, the other is the technical mechanism. Side by side:

| | SKOS | OASF (Open Agentic Schema Framework) |
|---|------|--------------------------------------|
| From | Library science (W3C) | Agent-skill schemas |
| Layer | Entry structure — the content model | Mechanics — the architecture |
| Answers | What goes in an entry | How the entry stays stable as it changes |
| Gives you | Preferred label, definition, scope note | Stable id, swappable label, version, known mislabels |

They combine cleanly: SKOS fills the entry, OASF keeps it stable as the meaning moves. What I left out is the rest of the semantic-web stack. No RDF triples. No reasoner. No ontology. Those solve machine inference across systems. My problem is a human and a model reading prose.

## The register is one file, referenced everywhere

Here is a single entry, in plain JSON:

```json
{
  "id": "term.follow-up",
  "preferredLabel": "follow-up task",
  "version": "1.1.0",
  "definition": "The next unit of work on a topic. Equal weight to the original by default.",
  "scopeNote": "NOT a smaller addendum. Scope is not reduced unless the user says so.",
  "knownMislabels": ["continuation", "small fix", "wrap-up"]
}
```

That one object carries both standards: the SKOS fields (label, definition, scope note) and the OASF machinery (id, version, known mislabels). The id never changes. The label can. Every document points at `term.follow-up` instead of restating the definition. Change the meaning in one place and every reader sees it.

The version does real work here. Treat a term's meaning like an API. A wording tweak is a patch bump. A widened or narrowed scope is a minor bump. A meaning that flips, the way "follow-up" did, is a major bump. When you review a diff on the register, the number tells you whether readers must relearn the term or not. That signal is free, and it is the difference between a safe edit and a silent breaking change.

A lint keeps this honest. Mine checks four things: the definition exists exactly once, each term is used at least a set minimum, a scope note is present, and every reference resolves. It warns. It does not block. A blocking check on prose becomes a nuisance you route around. A warning you actually read.

One more field earns its place: a namespace qualifier. If two projects both define "agent," the qualifier stops them from colliding silently. `term.follow-up` in one namespace is not `term.follow-up` in another.

## When one document breaks the pattern, fix the center

The tempting shortcut is a local fork. One document needs the term slightly differently, so you redefine it there. Do not. That is how drift starts.

The rule I follow is uniformity. If a document cannot live with the shared definition, the shared definition is too narrow. Sharpen it centrally to the smallest form that still covers every user. Then every document inherits the better version. The odd case is a signal about the register, not a license to branch.

## You do not need the semantic web for this

The whole thing runs on plain JSON and two small generators. One generator expands references into readable text for humans. The lint reads the same file. There is no database, no triple store, no query language.

That is the point worth keeping. The ideas here are 15 to 25 years old. SKOS is from 2009. The semantic-web vision is from 2001. None of it is new. What is new is the target. You are grounding terms for a language model that reads your prose, not for a machine running inference over a graph.

## Start with one file

Make a file called `registry.json`. Put your five most load-bearing terms in it, in the shape above. Then replace every restated definition in your other documents with a reference to the id. Add a ten-line script that warns when a reference does not resolve.

You will feel the blast radius shrink the first time you change a definition once and ship it everywhere. That is the payoff, and it costs you an afternoon.
