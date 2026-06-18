#!/usr/bin/env python3
import cgi
import json
import os
import sys
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


HOST = os.environ.get("ALCOHOLIC_CUTOUT_HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT") or os.environ.get("ALCOHOLIC_CUTOUT_PORT", "8787"))


def remove_with_remove_bg(image_bytes):
    api_key = os.environ.get("REMOVE_BG_API_KEY")
    if not api_key:
        raise RuntimeError("缺少 REMOVE_BG_API_KEY")

    boundary = "----alcoholic-cutout-boundary"
    body = b"".join([
        f"--{boundary}\r\n".encode(),
        b'Content-Disposition: form-data; name="image_file"; filename="drink.jpg"\r\n',
        b"Content-Type: image/jpeg\r\n\r\n",
        image_bytes,
        b"\r\n",
        f"--{boundary}\r\n".encode(),
        b'Content-Disposition: form-data; name="size"\r\n\r\nauto\r\n',
        f"--{boundary}--\r\n".encode(),
    ])
    request = urllib.request.Request(
        "https://api.remove.bg/v1.0/removebg",
        data=body,
        headers={
            "X-Api-Key": api_key,
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read()


class CutoutHandler(BaseHTTPRequestHandler):
    server_version = "AlcoholicCutout/1.1"

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path != "/health":
            self.send_error(404)
            return
        self._send_json(200, {
            "ok": True,
            "engine": "remove.bg",
            "configured": bool(os.environ.get("REMOVE_BG_API_KEY")),
        })

    def do_POST(self):
        if self.path != "/api/cutout":
            self.send_error(404)
            return

        try:
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={
                    "REQUEST_METHOD": "POST",
                    "CONTENT_TYPE": self.headers.get("Content-Type", ""),
                },
            )
            image_field = form["image"] if "image" in form else None
            if image_field is None or not getattr(image_field, "file", None):
                self._send_json(400, {"error": "没有收到图片"})
                return

            output = remove_with_remove_bg(image_field.file.read())
            self.send_response(200)
            self.send_header("Content-Type", "image/png")
            self.send_header("X-Cutout-Engine", "remove.bg")
            self.send_header("Content-Length", str(len(output)))
            self.end_headers()
            self.wfile.write(output)
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", errors="ignore")
            self._send_json(503, {"error": f"remove.bg 调用失败：{detail or error.reason}"})
        except Exception as error:
            self._send_json(503, {"error": str(error)})

    def log_message(self, fmt, *args):
        sys.stderr.write("[cutout] " + fmt % args + "\n")

    def _send_json(self, status, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def main():
    server = ThreadingHTTPServer((HOST, PORT), CutoutHandler)
    print(f"Alcoholic cutout service: http://{HOST}:{PORT}")
    print("Engine: remove.bg")
    server.serve_forever()


if __name__ == "__main__":
    main()
