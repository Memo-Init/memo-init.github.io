---
title: For LLMs
description: Machine-readable documentation for AI agents and LLMs.
---

This site publishes its complete specification in a machine-readable format, so AI
agents can load all relevant context in a single request instead of crawling
individual pages.

## Available Files

| File | Content | Size |
|------|---------|------|
| [llms.txt](https://memo-init.github.io/llms.txt) | The complete memo-init specification, concatenated into a single file | ~144 KB |

## Mini-Skill

Copy this block into your AI chat to give it full memo-init context:

```
# memo-init
Memo-driven, agentic software engineering. Guardrails first — an inductive
RFC-style specification that turns dictated transcripts into executable
work orders. Open Source (MIT).

## Documentation
Spec: https://memo-init.github.io/llms.txt

## GitHub
https://github.com/memo-init
```

## What is llms.txt?

The [llms.txt standard](https://github.com/answerdotai/llms-txt) (Jeremy Howard,
answer.ai) defines a compact, machine-readable format for project documentation.
It allows AI agents to load all relevant context in one step instead of crawling
individual pages.

## How it is generated

The file is produced at build time from the specification repository: the spec's
generated, concatenated `llms.txt` is copied verbatim into this site and served
as a static asset at [/llms.txt](https://memo-init.github.io/llms.txt). It is
regenerated on every deployment, so it always matches the published specification.
