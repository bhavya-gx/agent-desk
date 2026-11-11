# Build log

## 2026-11-11 — Public foundation

Created a dedicated repository named `brand-agent-workspace` while the product name is being chosen. Added an MIT license so reuse rights are explicit from the first commit. Added ignore rules so local databases and credentials do not enter Git history. Added contributor instructions requiring a plain-language project map and honest integration status.

The first pilot will use two invented brands. It will not import existing client conversations or connect publishing accounts.

Architecture decision: a small Python standard-library service and SQLite database make the pilot easy to run and inspect. Paperclip remains an optional execution backend; this project supplies the brand/contact/account context layer. The Claude skill is a client of the same service, not a second store of truth.

## Task and context model

Implemented one brand configuration per record, with contacts, audience profiles, account references, and agents nested inside it. Tasks require matching records from that brand. Added durable context snapshots and a chronological event log. Capability routing chooses an agent only when there is one clear match; otherwise an explicit assignee is required.

Added queued, running, review, blocked, and done states. Agent submission moves work to review. An owner approves, requests revisions, or resumes blocked work. Claims and handoffs run inside database transactions. Added scoped agent tokens and a separate owner token.

## Interface and skill

Built a browser dashboard with a brand switcher, task board, identity summary, task forms, output review, and history. Added a standalone Python helper and a Claude skill that uses the same API. No existing Claude settings were changed and no live provider accounts were connected.

## Paperclip adapter

Inspected upstream API conventions. Implemented preview and one-way dispatch to a configured company/agent. Added agent membership validation, task-version checking, and a reserved state for uncertain sends. Verified the HTTP contract against a local mock. A live Paperclip deployment and return synchronization remain unverified/unimplemented respectively.

## Verification and fixes

The first local test run could not bind HTTP ports under restricted execution. Re-ran with local networking permitted. Fixed database connections to close explicitly after each transaction. All 22 tests passed. Browser testing exercised owner sign-in, creating a task, claiming it, submitting a draft to review, and switching to another brand without carrying the first brand's tasks across. Fixed a flex layout constraint discovered during visual review.

## Brand and naming

Revised the shortlist after the owner requested Agent/Agentic names. Recommended AgentsByBrand and compared it with the reference products. Added a one-page brand overview, editable Markdown source, and a reproducible Word generator. Kept the public repository name neutral pending the owner's choice.

## Publication review

Rendered and visually inspected the Word brief, confirmed it is one page, and removed an inherited title border. Checked every Markdown file link and ensured all 28 public files appear in the project map. Scanned the public files against the generated local tokens; no matches were found. Formatted the browser source with Prettier 3.6.2 for readability. The local database, tokens, render intermediates, and outer chat workspace are excluded from the commit.

## 2026-11-11 — Agent Desk selected

Applied the owner's chosen product name, Agent Desk, to the browser title, sign-in label, wordmark, README, brand source, Word generator, package description, skill description, and license attribution. Renamed the public GitHub repository to `bhavya-gx/agent-desk` and updated the clone instructions and local Git remote. Kept the local directory, skill identifier, and environment variables stable so existing paths and setup continue to work.

Recorded that a separate open-source configuration manager already uses the Agent Desk name. Added an independence note and the descriptor “The agent workspace for brands.” Updated the naming decision while retaining the original shortlist as history.

Added `docs/product-concepts.md` with three proposals: Client Desks, Results Inbox, and Work-triggered Agents. Each has a public evidence link, a specific operator workflow, the pilot's existing coverage, missing work, and a validation plan. Distinguished individual Paperclip reports from proven product-wide limitations; Roma and Retinue documentation is not represented as customer complaints. Linked the concepts from the README and roadmap and added the new file to the project map. No proposed execution features were implemented in this naming/research update.

Verification: all 22 existing tests passed. Rebuilt the editable Word brief, rendered and visually inspected its single page. Reloaded the local browser app and verified the Agent Desk title and wordmark with the existing fictional task still present.
