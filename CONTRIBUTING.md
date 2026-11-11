# Contributing

Start with docs/project-map.md and docs/architecture.md. Keep changes small and document behavior a nontechnical owner can verify. Run `python3 -m unittest discover -s tests -v` before opening a pull request.

Use fictional data in tests and screenshots. Never include private brand records, contacts, access tokens, browser profiles, or database files. Add meaningful tests when changing task ownership, record scope, credentials, or external dispatch. Update the project map for files you add and the build log for significant changes.

The runtime intentionally uses Python's standard library. Propose dependencies when they solve a concrete problem. Document what is verified with mocks and what has been exercised with a live service.

Contributions are accepted under the repository's MIT license.
