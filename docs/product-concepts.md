# Agent Desk: three product concepts

Research checked November 11, 2026. These concepts are proposals, not released features. Lead with **Client Desks**: it is the closest fit to the owner's work across brands, people, profiles, accounts, and agents. Add reliable result return and recovery before live client execution, then optimize execution overhead.

## How to read the evidence

The strongest public evidence found was first-person Paperclip operator reports. These are individual experiences on particular versions and configurations; they do not establish prevalence or prove that every current installation has the same problem. No sufficiently strong customer-complaint evidence was found for Roma or Retinue in this research pass. Their documentation is used to understand scope, not presented as customer dissatisfaction. “Retinue” here means jklthinking/retinue; no product called “Retina” has been verified as the intended reference.

## 1. Client Desks

**Promise: Every client has its own working memory.**

**Observed problem.** In a September 14 Paperclip discussion, one operator reported agents returning to the original brief, repeating completed work, and losing or misinterpreting the latest decision. The reporter also acknowledged possible configuration causes. This supports investigating continuity, rather than claiming Paperclip universally lacks memory. [Operator report](https://github.com/paperclipai/paperclip/discussions/13396)

**Adaptation.** Give each brand a persistent desk containing its voice, contacts, audience profiles, account identities, approved decisions, and previous outcomes. Each decision has a source, date, approver, and replacement history. A task shows a readable context preview before assignment, including which decisions are current. When an external action is requested, the connector checks that its actual authenticated account matches the task's intended account.

**Example.** A writing agent resumes a Cedar Studio draft using the latest approved tone and the contact's previous feedback. Switching to Harbor Coaching changes the context and account selection together. A mismatch stops dispatch and explains what needs correcting.

**Why it fits.** The organizing unit is the client relationship. That directly serves an operator managing several brands without repeatedly briefing every agent. This is a proposed workflow advantage, not a claim that competing tools cannot be configured similarly.

**Pilot today.** Brand-scoped records, task snapshots, related completed-task history, and token boundaries exist. Versioned editable decisions, history imports, and verification of live account identities do not.

**Smallest useful next version.** Add an editable decision ledger, mark superseded decisions, show the selected context before handoff, and verify one connected account type. Keep all example data fictional until a private pilot is configured.

**Validation.** Run 20 scripted tasks switching between two brands and two agents. Check that each task uses the latest approved decision and correct account; intentionally mismatched accounts must be rejected. Ask the operator to count repeated briefing corrections against the existing workflow. No reduction claim is justified before measurement.

## 2. Results Inbox

**Promise: See the result, the blocker, and the next action.**

**Observed problem.** Paperclip issue #8458 describes work stranded after interruptions and recovery routing tasks to a human who cannot execute them automatically. It was open when checked; linked recovery work exists, so this is not evidence that Paperclip has no recovery features. [Operator report](https://github.com/paperclipai/paperclip/issues/8458)

**Adaptation.** Make the main review surface an inbox of deliverables. Every item carries the output, acceptance criteria, last confirmed checkpoint, current owner, and a concrete next action. Distinguish “the agent run ended” from “the requested outcome is ready” and “the owner accepted it.” Offer resume or reassign after verifying the previous worker is stopped. Persist external action identifiers so reconnecting does not blindly repeat a send or publication.

**Example.** A researcher finishes a brief but the writing agent disconnects. The owner sees “Brief ready; writer disconnected,” can inspect the brief, and can resume from that checkpoint. A successful process exit alone never marks the whole task done.

**Why it fits.** An operator can review work without reconstructing a run from logs. Retinue's README explicitly distinguishes delegation from launching a model, which reinforces the need to verify the whole path from assignment to returned artifact. That is a documented scope boundary, not a Retinue customer complaint. [Retinue documentation](https://github.com/jklthinking/retinue)

**Pilot today.** Review states, output text, events, and manual handoffs exist. Paperclip dispatch is one-way. There is no live return synchronization, automatic checkpoint recovery, or execution lease mechanism.

**Smallest useful next version.** Add Paperclip result synchronization and explicit reconciliation of uncertain sends. Then add checkpoints and worker leases, using stable identifiers for retries. External services that cannot confirm an action require owner reconciliation rather than an automatic retry.

**Validation.** Interrupt one controlled task before dispatch, during execution, and after submission. Each case must show an accurate state and recover to one reviewable result without repeating a confirmed external action. Verify against a real configured runtime before claiming end-to-end recovery.

## 3. Work-triggered Agents

**Promise: Spend model calls on useful work.**

**Observed problem.** In November 1 issue #18551, a Paperclip operator reported repeated session resets and costly context reloading for reassignment and timer wakes. A follow-up identifies this as an intentional policy with a tradeoff, not simply an accidental bug. The issue was open when checked. [Operator report](https://github.com/paperclipai/paperclip/issues/18551)

**Adaptation.** Use ordinary queue checks to decide whether work exists. Wake a model when a task becomes actionable or a user-approved schedule requires reasoning. Reuse task-specific sessions when appropriate, send relevant context changes, bound retry/review cycles, and show observed cost per client and accepted deliverable. Make missing usage data visible; do not present partial telemetry as a complete bill.

**Example.** An empty board requires no model call from Agent Desk. When a client approves a brief, the writer receives that approval and the relevant context. Its cost is attached to the resulting draft so the operator can compare outcomes and expenditure.

**Why it fits.** Quiet defaults and cost per accepted result are more useful to this operator than a generic token total. Paperclip already has company/agent budgets and cost controls; budgets alone are not a differentiator. [Paperclip cost documentation](https://github.com/paperclipai/paperclip/blob/master/docs/guides/board-operator/costs-and-budgets.md)

**Pilot today.** The local board makes no model calls, but that is because it does not run agents. It has no scheduler, live cost ingestion, or measured savings.

**Smallest useful next version.** After result synchronization works, add one event-triggered worker and task-level usage records. Align the connected runtime's own wake policy; Agent Desk cannot guarantee quiet behavior if upstream agents independently wake on timers.

**Validation.** Observe a controlled empty queue for 24 hours and verify zero Agent Desk model wakes. Compare the same small task set with and without context reuse, measuring accepted output quality, wake count, and observed spend. Publish results only after measuring them; do not promise a savings percentage.

## Competitive boundaries

Roma already documents focused context, incremental updates, human completion decisions, and webhook/held-poll worker patterns. Those are not defensible “missing features” claims. Agent Desk's proposed emphasis is the brand/contact/account relationship and its approved decisions, with reliable outcomes and measurable overhead. [Roma developer guides](https://roma.app/developers/guides)

An earlier Paperclip complaint about expensive idle-heartbeat model choice, #2225, is closed with a linked fix. It was excluded as evidence of a current missing control. [Historical issue](https://github.com/paperclipai/paperclip/issues/2225)

## Recommendation

Use **Client Desks** as the main product story: “Your agents, organized around each brand.” Build **Results Inbox** as the reliability foundation for real execution. Add **Work-triggered Agents** once a live execution path can supply meaningful usage data. These three concepts form one product, rather than three unrelated feature sets.
