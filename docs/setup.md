# Run the pilot and connect a skill

## Start locally

Use Python 3.11 or newer. The application has no third-party runtime dependencies.

```bash
git clone https://github.com/bhavya-gx/agent-desk.git
cd agent-desk
python3 -m app.server init
python3 -m app.server token
python3 -m app.server serve
```

Open http://127.0.0.1:4317 and paste the printed owner token into the local sign-in form. Keep it private. `init` creates the `.local/` directory; running it again refuses to overwrite your records. Stop the server with Ctrl+C. Restart it with `serve`; your tasks remain in the database.

## Make a separate private pilot

Copy `examples/two-brands.json` to `private/brands.json`, then edit the brand voices, profiles, contacts, account identities, and agents. Those are records, not secret storage. Use distinct IDs. Put a capability such as `writing` or `research` on each agent. If multiple agents share a capability, name the assignee when creating a task.

```bash
mkdir -p private
cp examples/two-brands.json private/brands.json
python3 -m app.server --data-dir private/runtime init --config private/brands.json
python3 -m app.server --data-dir private/runtime token
python3 -m app.server --data-dir private/runtime serve --port 4318
```

The service has no `.env` loader. Supply optional connection settings through the launching process's environment. Do not put actual credentials in configuration JSON or task descriptions.

## Use the Claude skill

For Claude Code, copy `skills/brand-workspace/` into your project's `.claude/skills/brand-workspace/`. Keep the script inside its `scripts/` folder. Other skills-compatible local hosts can use the same folder in their documented skill location. This pilot is tested as a standalone Python helper; it has not been end-to-end tested inside a live Claude session. Claude web environments that cannot reach your localhost need a separate supported connection; this pilot does not expose a public MCP server.

In the terminal that launches the agent, give it its own scoped token:

```bash
export WORKSPACE_URL=http://127.0.0.1:4317
export WORKSPACE_TOKEN="$(python3 -m app.server token --actor cedar-studio/cedar-writer)"
python3 skills/brand-workspace/scripts/workspace.py me
python3 skills/brand-workspace/scripts/workspace.py tasks --brand cedar-studio
```

Create a JSON task file in `private/`, then run:

```bash
python3 skills/brand-workspace/scripts/workspace.py create --json-file private/task.json
python3 skills/brand-workspace/scripts/workspace.py context --task TASK_ID
python3 skills/brand-workspace/scripts/workspace.py claim --task TASK_ID
```

Task fields are `brand_id`, `title`, `brief`, `capability`, `contact_id`, `profile_id`, `account_id`, and optional `agent_id`. Results use a JSON file containing `output`. Notes, blockers, and requested revisions use `note`. Handoffs use `agent_id` and `note`. The helper's `--help` lists commands. Agents cannot approve their own submissions with scoped agent tokens.

## Optional Paperclip handoff

Run and configure Paperclip separately using its [official setup guide](https://github.com/paperclipai/paperclip). This repository does not install Paperclip, sign into provider accounts, or start paid model runs.

Before initializing your private workspace, add `paperclip_company_id` to the brand and `paperclip_agent_id` to its agent. Use real IDs from the intended Paperclip instance. Set `PAPERCLIP_API_URL` and `PAPERCLIP_API_KEY` in the workspace server's environment. HTTPS is required except for loopback HTTP; redirects are rejected so credentials are not forwarded to another destination. The credential must have permission to inspect agents and create issues in the mapped company. Runtime-specific run IDs are not inferred; this connector acts as an owner integration, not as a Paperclip heartbeat worker.

With an owner workspace token:

```bash
python3 skills/brand-workspace/scripts/workspace.py paperclip-preview --task TASK_ID
python3 skills/brand-workspace/scripts/workspace.py dispatch --task TASK_ID
```

Preview reads local data only. Dispatch verifies the mapped agent and sends a task to Paperclip, which may wake a model and incur provider charges. It sends the selected task's context and prior approved work for that contact, not the complete workspace. The task then remains reserved locally. See architecture.md for one-way integration limits and uncertain-result handling.

## Back up and recover

Stop the server and any other writers, then copy the entire private runtime directory to your secure backup location. Keep `access.json` private. A live SQLite file copy can miss WAL changes; do not copy just the database while writers are running. Restore the complete directory and start with `--data-dir` pointing to it.

## Verify changes

```bash
python3 -m unittest discover -s tests -v
```

The tests create temporary local HTTP servers and fictional data. They make no real model calls or publishing requests.
