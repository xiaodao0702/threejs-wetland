const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.resolve('F:/VR design/threejs-wetland');
http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/save') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      fs.writeFileSync('F:/VR design/wetland-factory.glb', buf);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end('ok ' + buf.length);
      console.log('saved wetland-factory.glb', buf.length);
    });
    return;
  }
  let p = path.resolve(path.join(root, req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0])));
  if (!p.startsWith(root)) { res.statusCode = 403; res.end(); return; }
  fs.readFile(p, (e, d) => {
    if (e) { res.statusCode = 404; res.end('404'); return; }
    const ext = path.extname(p).toLowerCase();
    const t = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary' }[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', t);
    res.end(d);
  });
}).listen(8090, () => console.log('server up on 8090'));
