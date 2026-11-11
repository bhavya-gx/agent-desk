# Pilot roadmap

## Audience and visual review

The owner requested an everyday-person direction after the original brand-work pilot. [The consumer brief](consumer-direction.md) reframes the interface around personal tasks and AI helpers; [three visual previews](visual-directions.md) await selection. A consumer release requires simpler onboarding, verified agent/account connections, and a personal-space model as well as the chosen visual design. The working app and earlier integration milestones below remain the implementation baseline.

## Shipped in 0.1

Public MIT repository, browser board, fictional two-brand configuration, persistent tasks and event history, scoped API access, portable Claude skill, and one-way Paperclip dispatch. Automated tests cover boundaries and the connector's HTTP contract.

## Next integration milestone

Connect one separately configured Paperclip instance to a fictional brand; verify real API permissions, task creation, the intended agent wake, completed output, and cost reporting. Add a tested return path and owner-controlled reconciliation before relying on remote execution. The current connector has not been verified against a live instance.

## Proposed product direction

The [three researched concepts](product-concepts.md) are Client Desks, Results Inbox, and Work-triggered Agents. Lead positioning with brand-specific working memory. Build reliable result return and recovery before relying on live execution, then evaluate context and execution costs. These are proposed extensions, not features already shipped.

## Next usability milestone

Add brand, contact, account, and agent editing with versioned configuration. Preserve historical task snapshots. Add task dependencies and a research-to-writing handoff with separate capabilities. Add search and a workspace-wide owner view.

## Real client pilot

Choose two actual brands and explicitly map the intended contacts, profiles, agent runtimes, and acting accounts. Import selected history from authorized sources. Validate the first real workflow end to end before expanding. The public code and fictional examples remain separate from private runtime records.

## Beyond the local pilot

Consider hosted authentication, durable execution leases, credential storage, provider adapters, and team permissions only as required. Add an MCP server when a target host needs it; do not describe the current HTTP API as MCP.
