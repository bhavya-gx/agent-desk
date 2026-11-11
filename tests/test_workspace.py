import concurrent.futures
import copy
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from app.store import Store, WorkspaceError
from app.server import Server, initialize
from app.paperclip import Paperclip, dispatch, dispatch_preview

ROOT = Path(__file__).resolve().parents[1]
OWNER = {"id": "owner", "role": "owner"}
WRITER = {"id": "cedar-writer", "role": "agent", "brand_id": "cedar-studio", "agent_id": "cedar-writer"}
OTHER = {"id": "harbor-writer", "role": "agent", "brand_id": "harbor-coaching", "agent_id": "harbor-writer"}


def config():
    return json.loads((ROOT / "examples/two-brands.json").read_text())


def payload(**overrides):
    return {"brand_id": "cedar-studio", "title": "Draft a founder post", "brief": "Create a draft for review.",
            "contact_id": "morgan", "profile_id": "founders", "account_id": "cedar-linkedin", "capability": "writing", **overrides}


class StoreTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = Store(Path(self.temp.name) / "workspace.db")
        self.store.initialize(config())

    def tearDown(self):
        self.temp.cleanup()

    def test_cross_brand_account_rejected(self):
        with self.assertRaisesRegex(WorkspaceError, "accounts record"):
            self.store.create_task(payload(account_id="harbor-linkedin"), OWNER)
        self.assertEqual(self.store.list_tasks(OWNER), [])

    def test_cross_brand_contact_and_agent_rejected(self):
        for field, value in (("contact_id", "jordan"), ("agent_id", "harbor-writer"), ("profile_id", "people-leaders")):
            with self.subTest(field=field), self.assertRaises(WorkspaceError):
                self.store.create_task(payload(**{field: value}), OWNER)

    def test_worker_scope_enforced_on_list_read_and_create(self):
        task = self.store.create_task(payload(), OWNER)
        self.assertEqual(self.store.list_tasks(OTHER), [])
        with self.assertRaises(WorkspaceError) as exc:
            self.store.get_task(task["id"], OTHER)
        self.assertEqual(exc.exception.status, 403)
        with self.assertRaises(WorkspaceError):
            self.store.create_task(payload(), OTHER)
        self.assertEqual([b["id"] for b in self.store.brands(WRITER)], ["cedar-studio"])

    def test_review_requires_owner(self):
        task = self.store.create_task(payload(), WRITER)
        self.store.transition(task["id"], "claim", {}, WRITER)
        self.store.transition(task["id"], "submit", {"output": "A completed draft."}, WRITER)
        with self.assertRaises(WorkspaceError):
            self.store.transition(task["id"], "approve", {}, WRITER)
        done = self.store.transition(task["id"], "approve", {}, OWNER)
        self.assertEqual(done["status"], "done")
        self.assertEqual([e["action"] for e in done["history"]], ["created", "claim", "submit", "approve"])

    def test_only_one_concurrent_claim_succeeds(self):
        task = self.store.create_task(payload(), OWNER)
        def claim(_):
            try:
                self.store.transition(task["id"], "claim", {}, WRITER)
                return 200
            except WorkspaceError as exc:
                return exc.status
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            self.assertEqual(sorted(executor.map(claim, range(2))), [200, 409])

    def test_no_submission_before_claim(self):
        task = self.store.create_task(payload(), OWNER)
        with self.assertRaises(WorkspaceError):
            self.store.transition(task["id"], "submit", {"output": "Premature"}, WRITER)

    def test_history_only_same_brand_and_contact(self):
        old = self.store.create_task(payload(), OWNER)
        for action, body in (("claim", {}), ("submit", {"output": "Approved Cedar context"}), ("approve", {})):
            self.store.transition(old["id"], action, body, OWNER)
        current = self.store.create_task(payload(title="Follow-up"), OWNER)
        context = self.store.context(current["id"], WRITER)
        self.assertEqual(context["completed_contact_work"][0]["output"], "Approved Cedar context")
        harbor = self.store.create_task(payload(brand_id="harbor-coaching", contact_id="jordan", profile_id="people-leaders", account_id="harbor-linkedin"), OWNER)
        self.assertEqual(self.store.context(harbor["id"], OTHER)["completed_contact_work"], [])

    def test_restart_preserves_data(self):
        task = self.store.create_task(payload(), OWNER)
        reopened = Store(self.store.path)
        self.assertEqual(reopened.get_task(task["id"], OWNER)["title"], task["title"])
        with self.assertRaises(WorkspaceError):
            reopened.initialize(config())
        self.assertEqual(len(reopened.list_tasks(OWNER)), 1)

    def test_ambiguous_routing_requires_choice_and_handoff_revokes_old_access(self):
        store = Store(Path(self.temp.name) / "routing.db")
        cfg = config()
        cfg["brands"][0]["agents"].append({"id": "second-writer", "name": "Second Writer", "capabilities": ["writing"]})
        store.initialize(cfg)
        with self.assertRaisesRegex(WorkspaceError, "ambiguous"):
            store.create_task(payload(), OWNER)
        task = store.create_task(payload(agent_id="cedar-writer"), OWNER)
        handed = store.transition(task["id"], "handoff", {"agent_id": "second-writer", "note": "Continue with the agreed outline."}, WRITER)
        self.assertEqual(handed["agent_id"], "second-writer")
        with self.assertRaises(WorkspaceError):
            store.get_task(task["id"], WRITER)

    def test_unknown_account_fields_rejected(self):
        cfg = config()
        cfg["brands"][0]["accounts"][0]["password"] = "fake-password"
        other = Store(Path(self.temp.name) / "invalid.db")
        with self.assertRaisesRegex(WorkspaceError, "credentials"):
            other.initialize(cfg)

    def test_changed_task_prevents_stale_dispatch(self):
        task = self.store.create_task(payload(), OWNER)
        self.store.transition(task["id"], "note", {"note": "Changed instructions"}, OWNER)
        with self.assertRaisesRegex(WorkspaceError, "changed"):
            self.store.reserve_dispatch(task["id"], OWNER, task["updated_at"])


class HTTPTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = initialize(Path(self.temp.name) / "private", ROOT / "examples/two-brands.json")
        self.tokens = json.loads((Path(self.temp.name) / "private/access.json").read_text())
        self.server = Server(("127.0.0.1", 0), self.store, self.tokens)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_address[1]}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.temp.cleanup()

    def request(self, path, body=None, token=None, headers=None):
        hdr = {"Content-Type": "application/json", **(headers or {})}
        if token:
            hdr["Authorization"] = f"Bearer {token}"
        req = urllib.request.Request(self.base + path, headers=hdr, data=None if body is None else json.dumps(body).encode())
        try:
            response = urllib.request.urlopen(req)
        except urllib.error.HTTPError as exc:
            response = exc
        with response:
            return response.status, response.headers, response.read().decode()

    def test_authentication_and_token_not_echoed(self):
        self.assertEqual(self.request("/api/brands")[0], 401)
        status, _, body = self.request("/api/me", token=self.tokens[0]["token"])
        self.assertEqual(status, 200)
        self.assertNotIn(self.tokens[0]["token"], body)

    def test_browser_login_logout_invalidates_session(self):
        status, headers, _ = self.request("/api/login", {"token": self.tokens[0]["token"]})
        self.assertEqual(status, 200)
        cookie = headers["Set-Cookie"].split(";")[0]
        self.assertIn("HttpOnly", headers["Set-Cookie"])
        self.assertEqual(self.request("/api/brands", headers={"Cookie": cookie})[0], 200)
        self.request("/api/logout", {}, headers={"Cookie": cookie})
        self.assertEqual(self.request("/api/brands", headers={"Cookie": cookie})[0], 401)

    def test_foreign_origin_and_host_denied(self):
        for headers in ({"Origin": "https://example.com"}, {"Host": "attacker.example"}):
            self.assertEqual(self.request("/api/brands", token=self.tokens[0]["token"], headers=headers)[0], 403)

    def test_agent_cannot_use_owner_dashboard_login(self):
        self.assertEqual(self.request("/api/login", {"token": self.tokens[1]["token"]})[0], 401)

    def test_invalid_input_returns_error_without_task(self):
        self.assertEqual(self.request("/api/tasks", [], token=self.tokens[0]["token"])[0], 400)
        self.assertEqual(self.store.list_tasks(OWNER), [])

    def test_standalone_skill_client_uses_scoped_token(self):
        result = subprocess.run([sys.executable, str(ROOT / "skills/brand-workspace/scripts/workspace.py"), "brands"],
            env={**os.environ, "WORKSPACE_URL": self.base, "WORKSPACE_TOKEN": self.tokens[1]["token"]}, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual([b["id"] for b in json.loads(result.stdout)], ["cedar-studio"])

    def test_private_tokens_file_has_restricted_permissions(self):
        if os.name != "nt":
            mode = (Path(self.temp.name) / "private/access.json").stat().st_mode & 0o777
            self.assertEqual(mode, 0o600)


class PaperclipTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = Store(Path(self.temp.name) / "workspace.db")
        cfg = config()
        cfg["brands"][0]["paperclip_company_id"] = "company-cedar"
        cfg["brands"][0]["agents"][0]["paperclip_agent_id"] = "agent-cedar"
        self.store.initialize(cfg)
        self.task = self.store.create_task(payload(), OWNER)
        self.calls = []
        calls = self.calls
        class Mock(BaseHTTPRequestHandler):
            def log_message(self, *args): pass
            def do_GET(self):
                calls.append(("GET", self.path, self.headers.get("Authorization")))
                self.send_response(200); self.end_headers()
                self.wfile.write(b'[{"id":"agent-cedar"}]')
            def do_POST(self):
                body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                calls.append(("POST", self.path, body))
                self.send_response(201); self.end_headers()
                self.wfile.write(b'{"id":"issue-1","identifier":"CED-1"}')
        self.remote = ThreadingHTTPServer(("127.0.0.1", 0), Mock)
        self.thread = threading.Thread(target=self.remote.serve_forever, daemon=True)
        self.thread.start()
        self.client = Paperclip(f"http://127.0.0.1:{self.remote.server_address[1]}", "fake-test-token")

    def tearDown(self):
        self.remote.shutdown(); self.remote.server_close(); self.thread.join(); self.temp.cleanup()

    def test_preview_does_not_send_and_contains_only_selected_brand(self):
        preview = dispatch_preview(self.store, self.task["id"], OWNER)
        self.assertEqual(self.calls, [])
        self.assertIn("Cedar Studio", preview["payload"]["description"])
        self.assertNotIn("Harbor", preview["payload"]["description"])
        self.assertNotIn("fake-test-token", json.dumps(preview))

    def test_real_http_contract_against_mock_and_duplicate_prevention(self):
        result = dispatch(self.store, self.task["id"], OWNER, self.client)
        self.assertEqual(result["dispatch"]["issue_id"], "issue-1")
        self.assertEqual(self.calls[1][1], "/api/companies/company-cedar/issues")
        self.assertEqual(self.calls[1][2]["assigneeAgentId"], "agent-cedar")
        with self.assertRaises(WorkspaceError):
            dispatch(self.store, self.task["id"], OWNER, self.client)
        self.assertEqual(len([c for c in self.calls if c[0] == "POST"]), 1)
        with self.assertRaises(WorkspaceError):
            self.store.transition(self.task["id"], "claim", {}, WRITER)

    def test_uncertain_remote_outcome_blocks_retry(self):
        class Failure:
            def verify_agent(self, *args): pass
            def create_issue(self, *args): raise WorkspaceError("Network failed", 502)
        with self.assertRaises(WorkspaceError):
            dispatch(self.store, self.task["id"], OWNER, Failure())
        self.assertEqual(self.store.get_task(self.task["id"], OWNER)["dispatch"]["state"], "unknown")
        with self.assertRaises(WorkspaceError):
            self.store.reserve_dispatch(self.task["id"], OWNER)

    def test_plain_remote_http_rejected(self):
        with self.assertRaises(WorkspaceError):
            Paperclip("http://remote.example", "fake")


if __name__ == "__main__":
    unittest.main()
