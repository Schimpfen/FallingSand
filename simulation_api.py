import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs
from threading import Thread


def _float_param(params, key, default=None):
    values = params.get(key)
    if not values:
        return default
    try:
        return float(values[0])
    except (ValueError, TypeError):
        return default


def _make_handler(engine):
    class Handler(BaseHTTPRequestHandler):
        def send_json(self, payload, status=200):
            data = json.dumps(payload).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            parsed = urlparse(self.path)
            path = parsed.path
            params = parse_qs(parsed.query)

            if path == "/state":
                self.send_json(engine.snapshot())
            elif path == "/metrics":
                snapshot = engine.snapshot()
                self.send_json(
                    {
                        "delta_h": snapshot["delta_h"],
                        "top_height": snapshot["top_height"],
                        "bottom_height": snapshot["bottom_height"],
                        "mix_ratio": snapshot["mix_ratio"],
                    }
                )
            elif path in ("/mix", "/ratio"):
                self.send_json({"mix_ratio": engine.mix_ratio})
            else:
                self.send_json({"error": "unknown endpoint"}, status=404)

        def do_POST(self):
            parsed = urlparse(self.path)
            path = parsed.path
            params = parse_qs(parsed.query)

            if path in ("/step", "/advance"):
                engine.step()
                self.send_json({"result": "stepped", "mix_ratio": engine.mix_ratio})
                return

            if path == "/emit":
                engine.emit()
                self.send_json({"result": "emitted"})
                return

            if path in ("/mix", "/ratio"):
                value = _float_param(params, "value")
                if value is None:
                    length = int(self.headers.get("Content-Length", 0))
                    if length:
                        body = self.rfile.read(length).decode("utf-8")
                        try:
                            payload = json.loads(body)
                            value = float(payload.get("value", value))
                        except (json.JSONDecodeError, TypeError, ValueError):
                            value = None
                if value is None:
                    self.send_json({"error": "value required"}, status=400)
                else:
                    engine.set_mix(value)
                    self.send_json({"mix_ratio": engine.mix_ratio})
                return

            self.send_json({"error": "unknown endpoint"}, status=404)

        def log_message(self, format, *args):
            return

    return Handler


class SimulationAPIServer(Thread):
    """Runs a lightweight HTTP server exposing the simulation engine."""

    def __init__(self, engine, host="127.0.0.1", port=8000):
        super().__init__(daemon=True)
        handler = _make_handler(engine)
        self._server = ThreadingHTTPServer((host, port), handler)

    def run(self):
        self._server.serve_forever()

    def shutdown(self):
        self._server.shutdown()
        self._server.server_close()
