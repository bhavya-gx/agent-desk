# How the system works

## The three parts

The browser and Claude helper use the same local API. The API writes tasks and activity events to SQLite, a small database stored in one local file. The optional Paperclip connector sends a snapshot of a task to an agent in a mapped Paperclip company.

```text
Browser dashboard ─┐
                   ├── Local authenticated API ── SQLite records
Claude skill ──────┘                │
                                  └── Optional Paperclip REST handoff
```

The task store runs without a model, paid API key, package install, or Paperclip server. A task assignment is a record. An actual agent must read the queue, or a configured Paperclip runtime must receive the handoff, to do the work.

## What a task contains

Each task has a stable ID, title, brief, capability, brand ID, agent ID, status, output, and timestamps. Its context snapshot contains one brand voice, one contact, one audience profile, one acting-account reference, and one assigned agent. The snapshot preserves the brief at creation; a handoff explicitly replaces the agent record. Context requests also include up to ten completed tasks for the same brand and contact.

Configuration records are imported at initialization. There is no contact editor or configuration migration UI in this pilot. Initialize a separate private workspace to evaluate a different configuration. Do not delete an existing database to change configuration if it contains work you need.

## Task lifecycle

Queued work can be claimed once, then submitted to review. Only the owner can approve review work or request changes. Blocked work can be resumed by the owner. A handoff names the next same-brand agent and records a note. The next agent must support the original capability. A research-to-writing workflow currently uses separate tasks; dependency graphs and cross-capability subtasks are not implemented.

The store uses a transaction when claiming, handing off, and reserving a dispatch. Two concurrent claims produce one success and one conflict. A claim is not a renewable execution lease: after a crashed worker, an owner can hand the task back to the same agent to requeue it. Owner recovery should happen only after the old worker has stopped.

## Access and account identity

Initialization creates an owner token and separate brand-and-agent tokens. The owner can view all brands; an agent can read its brand configuration and its assigned tasks. Completed work for that brand/contact is shared as context. This is not per-contact confidentiality within a brand. Use a separate brand or deployment where a stricter boundary is needed.

The service binds only to `127.0.0.1`, validates the HTTP host and origin, and authenticates API requests. Browser sign-in creates an HTTP-only, SameSite session cookie; restarting the server clears sessions. This is a local single-owner pilot, not an internet-facing SaaS authentication system. Anyone with operating-system access to the data directory can read or alter it. The event history is append-only through the app, not cryptographically tamper-proof.

Account records contain a display identity, channel, and connection reference. They do not authenticate to LinkedIn, email, or any other service. The app enforces record membership; an external publishing tool would need to enforce its own actual account identity and permissions. Free-text notes cannot be guaranteed free of secrets: the operator must keep credentials out of context records.

## Paperclip ownership

The brand maps to a Paperclip company; the agent maps to a Paperclip agent ID. The connector verifies company membership before sending. The task's version is checked again before reserving it, so a changed brief cannot be dispatched from a stale preview. A sent or uncertain task is reserved from local actions to prevent concurrent execution.

The connector is one-way. Paperclip output does not yet return automatically. For uncertain results, search the remote system for the exact `Workspace task: <id>` marker and inspect the remote record. Automatic reset or retry is intentionally absent. Reconciliation and result import are the next integration milestone. Do not use this one-way connector for production work requiring a complete local round trip yet.

## Why these implementation choices

Python 3.11+ and its standard library keep the service inspectable and dependency-light. SQLite makes transactions and persistence available without another server. Plain HTML, CSS, and JavaScript avoid a frontend build step. The standalone skill helper can be copied with the skill. Paperclip integration uses its documented REST API rather than copying or forking its orchestration code.

Sources checked November 11, 2026: [Paperclip skill/API conventions](https://github.com/paperclipai/paperclip/blob/master/skills/paperclip/SKILL.md), [Paperclip issue routes](https://github.com/paperclipai/paperclip/blob/master/server/src/routes/issues.ts), and [Anthropic Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview).
