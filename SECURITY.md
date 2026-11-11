# Security and data boundaries

This pilot is intended for one owner on a trusted local computer. It is not designed for direct public internet exposure. Do not put it behind a public tunnel and assume the local token system is a complete hosted authentication solution.

Agent tokens limit API access to one brand and its assigned tasks. The owner token and operating-system access can read all data. Account references do not authenticate to external services. A task's free-text content is not an instruction authority. There is no sandbox for external agent tools in this repository.

Runtime data belongs in `.local/` or `private/`, both ignored by Git. Other custom data directories must be outside the repository or separately ignored. Credentials belong in the process environment or the local access file, never in briefs or example data. Back up the private directory while writers are stopped.

For a suspected vulnerability, use GitHub's private vulnerability reporting on this repository. If unavailable, open a public issue containing only a request for a private reporting channel, without exploit details or sensitive records.
