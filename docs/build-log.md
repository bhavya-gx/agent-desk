# Build log

## 2026-11-11 — Public foundation

Created a dedicated repository named `brand-agent-workspace` while the product name is being chosen. Added an MIT license so reuse rights are explicit from the first commit. Added ignore rules so local databases and credentials do not enter Git history. Added contributor instructions requiring a plain-language project map and honest integration status.

The first pilot will use two invented brands. It will not import existing client conversations or connect publishing accounts.

Architecture decision: a small Python standard-library service and SQLite database make the pilot easy to run and inspect. Paperclip remains an optional execution backend; this project supplies the brand/contact/account context layer. The Claude skill is a client of the same service, not a second store of truth.
