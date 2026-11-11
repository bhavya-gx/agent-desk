#!/usr/bin/env python3
"""Portable, dependency-free client for the workspace API."""
import argparse
import json
import os
from pathlib import Path
import sys
import urllib.error
import urllib.parse
import urllib.request


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["me", "brands", "tasks", "context", "create", "claim", "submit", "approve", "revise", "block", "resume", "handoff", "note", "paperclip-preview", "dispatch"])
    parser.add_argument("--task")
    parser.add_argument("--brand")
    parser.add_argument("--json-file", type=Path)
    args = parser.parse_args()
    base = os.environ.get("WORKSPACE_URL", "http://127.0.0.1:4317").rstrip("/")
    token = os.environ.get("WORKSPACE_TOKEN")
    url = urllib.parse.urlparse(base)
    if not token:
        parser.error("Set WORKSPACE_TOKEN to your owner or scoped agent token")
    if not (url.scheme == "https" or (url.scheme == "http" and url.hostname in ("127.0.0.1", "localhost", "::1"))) or url.username or url.password or url.query or url.fragment:
        parser.error("WORKSPACE_URL must be HTTPS or loopback HTTP without credentials, query, or fragment")
    command = args.command
    method = "GET"
    if command in ("me", "brands", "tasks"):
        path = f"/api/{command}"
        if command == "tasks" and args.brand:
            path += "?" + urllib.parse.urlencode({"brand_id": args.brand})
    elif command == "create":
        path, method = "/api/tasks", "POST"
    else:
        if not args.task:
            parser.error("This command requires --task")
        action = "paperclip" if command == "paperclip-preview" else command
        path = f"/api/tasks/{urllib.parse.quote(args.task, safe='')}/{action}"
        if command not in ("context", "paperclip-preview"):
            method = "POST"
    if command in ("create", "submit", "revise", "block", "handoff", "note") and not args.json_file:
        parser.error("This command requires --json-file")
    try:
        body = json.loads(args.json_file.read_text()) if args.json_file else {}
        data = json.dumps(body).encode() if method == "POST" else None
        req = urllib.request.Request(base + path, data=data, method=method,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
        with urllib.request.build_opener(NoRedirect).open(req, timeout=50) as response:
            print(json.dumps(json.load(response), indent=2, ensure_ascii=False))
    except urllib.error.HTTPError as exc:
        # Server errors are structured and do not contain request tokens.
        try:
            message = json.load(exc).get("error", f"HTTP {exc.code}")
        except (ValueError, AttributeError):
            message = f"HTTP {exc.code}"
        print(f"Error ({exc.code}): {message}", file=sys.stderr)
        return 1
    except (OSError, ValueError):
        print("Request failed. Check the service and JSON file. Do not retry uncertain mutations automatically.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
