# Brand Agent Workspace

An open-source workspace for coordinating AI agents across brands, contacts, accounts, and task history.

**Status: initial scaffold. Product name pending.** This repository is public from the first implementation commit. The first pilot will use fictional brands and an optional Paperclip connector.

## What we are building

- Brand-specific context, contact profiles, and account references.
- A durable task queue with ownership, handoffs, and review history.
- A Claude skill that uses those records before doing client work.
- A Paperclip connector for handing tasks to an existing agent runtime.

## Project documentation

- [Build log](docs/build-log.md): each meaningful change and why it exists.
- [License](LICENSE): MIT permission to use, modify, and share the code.

No client records, credentials, or private chat histories belong in this repository.

Independent project; not affiliated with Paperclip or Anthropic.
