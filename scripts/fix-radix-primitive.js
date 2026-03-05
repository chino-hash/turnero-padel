/**
 * Elimina la copia anidada de @radix-ui/primitive dentro de react-dropdown-menu
 * para que Node use la versión en node_modules/@radix-ui/primitive y evite ENOENT en build.
 */
const path = require('path');
const fs = require('fs');

const nested = path.join(
  __dirname,
  '..',
  'node_modules',
  '@radix-ui',
  'react-dropdown-menu',
  'node_modules',
  '@radix-ui',
  'primitive'
);

try {
  if (fs.existsSync(nested)) {
    fs.rmSync(nested, { recursive: true });
    console.log('fix-radix-primitive: removed nested @radix-ui/primitive');
  }
} catch (e) {
  console.warn('fix-radix-primitive:', e.message);
}
