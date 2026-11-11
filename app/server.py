"""Loopback-only web app and authenticated JSON API."""
import argparse
import hashlib
import hmac
import json
import os
from pathlib import Path
import secrets
import threading
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from .paperclip import dispatch, dispatch_preview
from .store import Store, WorkspaceError, require

WEB = Path(__file__).with_name("web")


def write_private(path, data):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w") as handle:
        json.dump(data, handle, indent=2)


def initialize(directory, config_path):
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    require(not (directory / "access.json").exists(), "Workspace already initialized", 409)
    config = json.loads(Path(config_path).read_text())
    store = Store(directory / "workspace.db")
    store.initialize(config)
    tokens = [{"id": "owner", "role": "owner", "token": secrets.token_urlsafe(32)}]
    for brand in config["brands"]:
        for agent in brand["agents"]:
            tokens.append({"id": f"{brand['id']}/{agent['id']}", "role": "agent",
                           "brand_id": brand["id"], "agent_id": agent["id"], "token": secrets.token_urlsafe(32)})
    write_private(directory / "access.json", tokens)
    return store


class Server(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address, store, tokens):
        self.store = store
        self.tokens = tokens
        self.sessions = {}
        self.session_lock = threading.Lock()
        super().__init__(address, Handler)


class Handler(BaseHTTPRequestHandler):
    server_version = "BrandWorkspace/0.1"

    def log_message(self, fmt, *args):
        pass  # Avoid retaining tokens, contact records, or arbitrary request content.

    def send(self, status, body, content_type="application/json; charset=utf-8", cookie=None):
        raw = json.dumps(body, ensure_ascii=False).encode() if content_type.startswith("application/json") else body
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
        if cookie:
            self.send_header("Set-Cookie", cookie)
        self.end_headers()
        self.wfile.write(raw)

    def check_origin(self):
        port = self.server.server_address[1]
        allowed = {f"127.0.0.1:{port}", f"localhost:{port}"}
        require(self.headers.get("Host") in allowed, "Invalid local host", 403)
        origin = self.headers.get("Origin")
        require(not origin or origin in {f"http://{host}" for host in allowed}, "Cross-origin request denied", 403)
        require(self.headers.get("Sec-Fetch-Site") not in ("cross-site",), "Cross-site request denied", 403)

    def token_actor(self, token):
        if not isinstance(token, str):
            return None
        for record in self.server.tokens:
            if hmac.compare_digest(record["token"], token):
                return {k: v for k, v in record.items() if k != "token"}
        return None

    def actor(self):
        auth = self.headers.get("Authorization", "")
        actor = self.token_actor(auth[7:]) if auth.startswith("Bearer ") else None
        if not actor:
            cookie = SimpleCookie()
            try:
                cookie.load(self.headers.get("Cookie", ""))
                token = cookie["workspace_session"].value if "workspace_session" in cookie else ""
            except Exception:
                token = ""
            with self.server.session_lock:
                actor = self.server.sessions.get(hashlib.sha256(token.encode()).hexdigest())
        require(actor is not None, "Sign in with your workspace token", 401)
        return actor

    def body(self):
        require(self.headers.get("Content-Type", "").split(";")[0] == "application/json", "Use application/json", 415)
        try:
            length = int(self.headers.get("Content-Length", "0"))
            require(0 < length <= 100000, "Request body must be between 1 and 100000 bytes", 413)
            result = json.loads(self.rfile.read(length))
            require(isinstance(result, dict), "Expected a JSON object")
            return result
        except (ValueError, UnicodeDecodeError):
            raise WorkspaceError("Invalid JSON body") from None

    def do_GET(self):
        self.handle_request("GET")

    def do_POST(self):
        self.handle_request("POST")

    def handle_request(self, method):
        try:
            self.check_origin()
            parsed = urlparse(self.path)
            path = parsed.path
            assets = {"/": ("index.html", "text/html; charset=utf-8"),
                      "/style.css": ("style.css", "text/css; charset=utf-8"),
                      "/app.js": ("app.js", "text/javascript; charset=utf-8")}
            if method == "GET" and path in assets:
                name, mime = assets[path]
                return self.send(200, (WEB / name).read_bytes(), mime)
            if method == "GET" and path == "/health":
                return self.send(200, {"ok": True, "version": "0.1.0"})
            if method == "POST" and path == "/api/login":
                actor = self.token_actor(self.body().get("token"))
                require(actor and actor["role"] == "owner", "An owner token is required for the dashboard", 401)
                token = secrets.token_urlsafe(32)
                with self.server.session_lock:
                    self.server.sessions[hashlib.sha256(token.encode()).hexdigest()] = actor
                return self.send(200, {"actor": actor}, cookie=f"workspace_session={token}; HttpOnly; SameSite=Strict; Path=/")
            actor = self.actor()
            store = self.server.store
            if method == "POST" and path == "/api/logout":
                # Invalidate this browser's server-side session as well as its cookie.
                cookie = SimpleCookie(self.headers.get("Cookie", ""))
                token = cookie["workspace_session"].value if "workspace_session" in cookie else ""
                with self.server.session_lock:
                    self.server.sessions.pop(hashlib.sha256(token.encode()).hexdigest(), None)
                return self.send(200, {"ok": True}, cookie="workspace_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0")
            if method == "GET" and path == "/api/me":
                return self.send(200, actor)
            if method == "GET" and path == "/api/brands":
                return self.send(200, store.brands(actor))
            if path == "/api/tasks":
                if method == "GET":
                    brand_id = parse_qs(parsed.query).get("brand_id", [None])[0]
                    return self.send(200, store.list_tasks(actor, brand_id))
                return self.send(201, store.create_task(self.body(), actor))
            parts = path.strip("/").split("/")
            if len(parts) in (3, 4) and parts[:2] == ["api", "tasks"]:
                task_id = parts[2]
                if method == "GET" and len(parts) == 3:
                    return self.send(200, store.get_task(task_id, actor))
                if method == "GET" and parts[-1] == "context":
                    return self.send(200, store.context(task_id, actor))
                if method == "GET" and parts[-1] == "paperclip":
                    return self.send(200, dispatch_preview(store, task_id, actor))
                if method == "POST" and len(parts) == 4:
                    body = self.body()
                    if parts[-1] == "dispatch":
                        return self.send(200, dispatch(store, task_id, actor))
                    return self.send(200, store.transition(task_id, parts[-1], body, actor))
            raise WorkspaceError("Route not found", 404)
        except WorkspaceError as exc:
            self.send(exc.status, {"error": str(exc)})
        except Exception:
            self.send(500, {"error": "Unexpected server error; inspect the local installation"})


def main():
    parser = argparse.ArgumentParser(description="Local workspace for brands and AI agents")
    parser.add_argument("--data-dir", default=".local", help="Private runtime directory, excluded from Git")
    commands = parser.add_subparsers(dest="command", required=True)
    init = commands.add_parser("init", help="Initialize a new workspace from JSON")
    init.add_argument("--config", default="examples/two-brands.json")
    serve = commands.add_parser("serve", help="Serve dashboard and API on loopback")
    serve.add_argument("--port", type=int, default=4317)
    token = commands.add_parser("token", help="Print one access token for local setup")
    token.add_argument("--actor", default="owner", help="owner or brand-id/agent-id")
    args = parser.parse_args()
    directory = Path(args.data_dir)
    try:
        if args.command == "init":
            initialize(directory, args.config)
            print(f"Initialized {directory}. Run: python3 -m app.server token")
            return
        require((directory / "access.json").exists(), "Run init first")
        tokens = json.loads((directory / "access.json").read_text())
        if args.command == "token":
            found = next((t for t in tokens if t["id"] == args.actor), None)
            require(found is not None, "Unknown actor")
            print(found["token"])
            return
        server = Server(("127.0.0.1", args.port), Store(directory / "workspace.db"), tokens)
        print(f"Workspace ready at http://127.0.0.1:{server.server_address[1]}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            server.server_close()
    except (WorkspaceError, OSError, ValueError) as exc:
        parser.exit(1, f"Error: {exc}\n")


if __name__ == "__main__":
    main()
