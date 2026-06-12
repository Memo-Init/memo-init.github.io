---
title: For LLMs
description: Machine-readable documentation for AI agents and LLMs.
---

This site publishes its documentation in a machine-readable format, so AI agents
can load all relevant context in a single request instead of crawling individual
pages. The content is layered — pick the file that matches how much context you
need.

## Mini-Skill

Copy this block into your AI chat to give it full memo-init context:

```
# memo-init
Memo-driven, agentic software engineering. Guardrails first — an inductive
RFC-style specification that turns dictated transcripts into executable
work orders. Open Source (MIT).

## Documentation
Docs: https://memo-init.github.io/docs-llms.txt
Full: https://memo-init.github.io/llms-full.txt

## GitHub
https://github.com/memo-init
```

## Available Files

| File | Content | Role |
|------|---------|------|
| [llms.txt](https://memo-init.github.io/llms.txt) | Curated index — overview and pointers to the layers below | Index |
| [docs-llms.txt](https://memo-init.github.io/docs-llms.txt) | Practical documentation (workbench + introduction), specification excluded | Docs |
| [llms-full.txt](https://memo-init.github.io/llms-full.txt) | Full website content — every page concatenated (spec + workbench) | Full dump |

Start with `llms.txt` to see what exists, then load `docs-llms.txt` for the
practical guides or `llms-full.txt` for the complete specification text.

## What is llms.txt?

The [llms.txt standard](https://github.com/answerdotai/llms-txt) (Jeremy Howard,
answer.ai) defines a compact, machine-readable format for project documentation.
It allows AI agents to load all relevant context in one step instead of crawling
individual pages. The index file (`llms.txt`) points; the full file
(`llms-full.txt`) carries the payload.

## How it is generated

The three files are produced at build time from the documentation pages:
`llms.txt` is a hand-curated index, `docs-llms.txt` concatenates the practical
docs, and `llms-full.txt` concatenates every page. They are regenerated on every
deployment, so they always match the published site.
