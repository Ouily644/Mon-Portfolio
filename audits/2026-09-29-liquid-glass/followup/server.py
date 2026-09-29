from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit,parse_qs
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
    def end_headers(self):
        self.send_header('Cache-Control','no-store');super().end_headers()
    def do_GET(self):
        path=urlsplit(self.path).path
        query=parse_qs(urlsplit(self.headers.get('Referer','')).query)
        if path=='/__perf_probe.js':
            content=(HERE/'probe.js').read_bytes();typ='text/javascript'
        elif path in ['/projets.html','/index.html']:
            content=(ROOT/path.lstrip('/')).read_bytes().replace(b'<head>',b'<head><script src="/__perf_probe.js"></script>',1);typ='text/html; charset=utf-8'
        elif path=='/nav-glass.js':
            source=HERE/'nav-before.js' if query.get('captures')==['before'] else ROOT/'nav-glass.js'
            text=source.read_text()
            if query.get('specular')==['on']: text=text.replace('specular: false','specular: true',1)
            content=text.encode();typ='text/javascript'
        elif path=='/assets/vendor/liquidgl/liquidGL.js':
            source=HERE/'vendor-before.js' if query.get('captures')==['before'] else ROOT/path.lstrip('/')
            text=source.read_text()
            text=text.replace('    async captureSnapshot() {', '''    async captureSnapshot() {
      const event = {t:performance.now(), anchor:this._anchor.className, eligible:!this._destroyed&&!this._capturing, caller:new Error().stack.split('\\n').slice(2,4).join(' ')};
      (window.__perfCaptures ||= []).push(event);
      try { const result = await this._perfCaptureSnapshot(); event.ok=!!result; return result; }
      finally { event.ms=performance.now()-event.t; }
    }
    async _perfCaptureSnapshot() {''',1)
            text=text.replace('    _renderFrame(lower) {','    _renderFrame(lower) {\n      (window.__perfDraws ||= []).push(performance.now());',1)
            content=text.encode();typ='text/javascript'
        else:return super().do_GET()
        self.send_response(200);self.send_header('Content-Type',typ);self.send_header('Content-Length',str(len(content)));self.end_headers();self.wfile.write(content)
    def log_message(self,*args):pass
ThreadingHTTPServer(('127.0.0.1',8006),Handler).serve_forever()
