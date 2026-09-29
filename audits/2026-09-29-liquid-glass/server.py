from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[2]
PROBE=Path(__file__).with_name('probe.js').read_bytes()
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        super().end_headers()
    def do_GET(self):
        path=urlsplit(self.path).path
        if path=='/__perf_probe.js':
            content=Path(__file__).with_name('probe.js').read_bytes(); typ='text/javascript'
        elif path in ['/projets.html','/index.html']:
            content=(ROOT/path.lstrip('/')).read_bytes().replace(b'<head>',b'<head><script src="/__perf_probe.js"></script>',1);typ='text/html; charset=utf-8'
        else: return super().do_GET()
        self.send_response(200);self.send_header('Content-Type',typ);self.send_header('Content-Length',str(len(content)));self.end_headers();self.wfile.write(content)
    def log_message(self,*args): pass
ThreadingHTTPServer(('127.0.0.1',8006),Handler).serve_forever()
