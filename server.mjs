import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const host = '0.0.0.0';
const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const publicDir = resolve('dist/mbbs-front-end-01/browser');
const indexFile = join(publicDir, 'index.html');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

if (!existsSync(indexFile)) {
  console.error(`Angular build output was not found at ${indexFile}`);
  process.exit(1);
}

createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('ok');
    return;
  }

  const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);

  const requestedFile = resolve(publicDir, `.${normalize(pathname)}`);
  const isInsidePublicDir =
    requestedFile === publicDir || requestedFile.startsWith(`${publicDir}\\`) || requestedFile.startsWith(`${publicDir}/`);
  const file =
    isInsidePublicDir && existsSync(requestedFile) && statSync(requestedFile).isFile()
      ? requestedFile
      : indexFile;

  const stat = statSync(file);
  const contentType = contentTypes[extname(file).toLowerCase()] ?? 'application/octet-stream';
  const range = request.headers.range;

  if (range && file !== indexFile) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = end - start + 1;

    response.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    createReadStream(file, { start, end }).pipe(response);
  } else {
    response.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': file === indexFile ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    createReadStream(file).pipe(response);
  }
}).listen(port, host, () => {
  console.log(`Frontend listening on http://${host}:${port}`);
});
