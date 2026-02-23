/**
 * Verifica el tamaño del middleware para comparar con el límite de 1MB de Vercel.
 * Vercel mide el tamaño después de compresión gzip.
 * Usa middleware-manifest.json para incluir todos los archivos del bundle (JS + WASM).
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const LIMIT_BYTES = 1024 * 1024; // 1 MB
const nextDir = path.join(__dirname, '..', '.next');
const manifestPath = path.join(nextDir, 'server', 'middleware-manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.error('No se encontró middleware-manifest.json. Ejecuta "npm run build" primero.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const mwConfig = manifest.middleware?.['/'] || manifest.middleware?.root;
if (!mwConfig) {
  console.error('No se encontró configuración del middleware en el manifest.');
  process.exit(1);
}

const serverDir = path.join(nextDir, 'server');
const files = mwConfig.files || [];
const wasmFiles = (mwConfig.wasm || []).map((w) => w.filePath);
const allPaths = [...files, ...wasmFiles];

let totalRaw = 0;
const buffers = [];

for (const relPath of allPaths) {
  const resolved = path.join(nextDir, relPath);
  if (!fs.existsSync(resolved)) {
    console.warn('  ⚠ Archivo no encontrado:', relPath);
    continue;
  }
  const buf = fs.readFileSync(resolved);
  totalRaw += buf.length;
  buffers.push(buf);
  const kb = (buf.length / 1024).toFixed(1);
  console.log(`  - ${relPath}: ${kb} KB`);
}

const combined = Buffer.concat(buffers);
const gzipped = zlib.gzipSync(combined);
const gzippedSize = gzipped.length;

const rawMB = (totalRaw / 1024 / 1024).toFixed(2);
const gzipKB = (gzippedSize / 1024).toFixed(2);
const limitKB = (LIMIT_BYTES / 1024).toFixed(0);
const exceeds = gzippedSize > LIMIT_BYTES;

console.log('');
console.log('=== Tamaño total del Middleware (Edge Function) ===');
console.log(`Archivos incluidos: ${allPaths.length}`);
console.log(`Raw total:  ${rawMB} MB (${totalRaw.toLocaleString()} bytes)`);
console.log(`Gzip:       ${gzipKB} KB (${gzippedSize.toLocaleString()} bytes)`);
console.log(`Límite Vercel Hobby: ${limitKB} KB (1 MB)`);
console.log('');
if (exceeds) {
  const over = ((gzippedSize - LIMIT_BYTES) / 1024).toFixed(1);
  console.log(`❌ EXCEDE el límite por ~${over} KB`);
  process.exit(1);
} else {
  const margin = ((LIMIT_BYTES - gzippedSize) / 1024).toFixed(1);
  console.log(`✅ Dentro del límite (margen: ~${margin} KB)`);
  process.exit(0);
}
