import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const port=Number(process.env.PORT)||4186;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'};
if(!fs.existsSync(path.join(root,'index.html'))){console.error('Build missing: run npm run build first.');process.exit(1);}
const server=http.createServer((req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,content)=>{if(err){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}).end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'}).end(content);});}catch{res.writeHead(400).end();}});
server.on('error',err=>{console.error(err.code==='EADDRINUSE'?`Port ${port} is already in use. Existing services were not stopped.`:err.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Birthday Kitchen V3: http://127.0.0.1:${port}/\nPress Ctrl+C to stop.`));
