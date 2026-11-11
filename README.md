# Agent Desk

**The agent workspace for brands.** An open-source workspace for coordinating AI agents across brands, contacts, accounts, and task history.

**Status: working local pilot, not a production SaaS.** This MIT repository was public before implementation began. The owner selected Agent Desk on November 11, 2026.

## What works now

- A browser dashboard with separate brands, contacts, audience profiles, and account references.
- A durable SQLite task queue: create, claim, submit, review, revise, block, resume, and hand off.
- Scoped access tokens and code-level checks that related records belong to the same brand.
- A portable Claude skill and a Python client for the same task API.
- A one-way Paperclip REST connector with preview, company/agent checks, and duplicate prevention.

## Quick start

Python 3.11+ is the only application requirement. No model key or package install is needed for the local demo.

```bash
python3 -m app.server init
python3 -m app.server token
python3 -m app.server serve
```

Open http://127.0.0.1:4317 and sign in with the printed owner token. The example brands and contacts are fictional. Runtime files go in `.local/`, which Git ignores. See [setup](docs/setup.md) for a separate private configuration and the Claude skill installation.

## Honest limits

This is a single-owner loopback service. It does not import existing chats, authenticate publishing accounts, or run agents by itself. The Paperclip connector has been tested against a local mock of the documented API, not a live Paperclip deployment. Return synchronization and dispatch reconciliation are not implemented yet. Configuration is imported at initialization; record editing and migrations are future work.

## Tests

```bash
python3 -m unittest discover -s tests -v
```

The suite covers brand/account boundaries, ownership, concurrent claims, review permissions, persistence, HTTP authentication, the portable skill helper, and the Paperclip handoff contract. GitHub Actions runs it on Python 3.11 and 3.13.

## Project documentation

- [Build log](docs/build-log.md): each meaningful change and why it exists.
- [Every folder and file](docs/project-map.md): a plain-language tour.
- [How it works](docs/architecture.md): data flow, access boundaries, and limitations.
- [Setup](docs/setup.md): local service, private configuration, and agent connections.
- [One-page brand document](docs/brand-one-page.docx) and [editable text](docs/brand.md).
- [Naming decision and competitor comparison](docs/naming.md).
- [Three product concepts](docs/product-concepts.md): adaptations of reported operator problems, with sources and validation plans.
- [Roadmap](docs/roadmap.md): what is shipped and what comes next.
- [License](LICENSE): MIT permission to use, modify, and share the code.

No client records, credentials, or private chat histories belong in this repository.

Independent project; not affiliated with Paperclip, Anthropic, or the separate [Agent Desk configuration manager](https://agentdesk.sh/). See the [naming note](docs/naming.md).
