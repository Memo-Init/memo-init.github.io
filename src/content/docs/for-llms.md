---
title: For LLMs
description: Machine-readable documentation for AI agents and LLMs.
---

This site publishes its documentation in a machine-readable format, so AI agents
can load all relevant context in a single request instead of crawling individual
pages. Everything lives in one file.

## Mini-Skill

Copy this block into your AI chat to give it full memo-init context:

```
# memo-init
Memo-driven, agentic software engineering. Guardrails first — an inductive
RFC-style specification that turns dictated transcripts into executable
work orders. Open Source (MIT).

## Documentation
Full: https://memo-init.github.io/llms.txt

## GitHub
https://github.com/memo-init
```

## Available Files

| File | Content | Role |
|------|---------|------|
| [llms.txt](https://memo-init.github.io/llms.txt) | The complete specification — every family's chapters concatenated | Full content |

Load `llms.txt` to get the entire specification text in one request.

## What is llms.txt?

The [llms.txt standard](https://github.com/answerdotai/llms-txt) (Jeremy Howard,
answer.ai) defines a compact, machine-readable format for project documentation.
It allows AI agents to load all relevant context in one step instead of crawling
individual pages.

## How it is produced

`llms.txt` is not synthesized on this site — it is copied through from the spec
repository, which emits one spec-only bundle per family. The published file is the
pass-through concatenation of those family bundles, refreshed on every deployment,
so it always matches the specification the site was built from.
