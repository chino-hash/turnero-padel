const fs = require('fs');
const path = require('path');

// Función para calcular la ruta relativa
function calculateRelativePath(fromFile, toPath) {
  const fromDir = path.dirname(fromFile);
  const targetPath = path.resolve(toPath);
  let relativePath = path.relative(fromDir, targetPath);
  
  // Convertir barras invertidas a barras normales para imports
  relativePath = relativePath.replace(/\\/g, '/');
  
  // Asegurar que empiece con ./ si no empieza con ../
  if (!relativePath.startsWith('../') && !relativePath.startsWith('./')) {
    relativePath = './' + relativePath;
  }
  
  return relativePath;
}

// Función para procesar un archivo
function processFile(filePath) {
  console.log(`Procesando: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Buscar todos los imports que usan '@/' (incluyendo multilínea)
  const importRegex = /import\s+[\s\S]*?from\s+['"]@\/([^'"]+)['"]/g;
  
  content = content.replace(importRegex, (match, importPath) => {
    const relativePath = calculateRelativePath(filePath, importPath);
    console.log(`  ${match.split('from')[1].trim()} -> from '${relativePath}'`);
    modified = true;
    return match.replace(`@/${importPath}`, relativePath);
  });
  
  // Buscar jest.mock que usan '@/'
  const mockRegex = /jest\.mock\(['"]@\/([^'"]+)['"]/g;
  
  content = content.replace(mockRegex, (match, mockPath) => {
    const relativePath = calculateRelativePath(filePath, mockPath);
    console.log(`  jest.mock('./${mockPath}') -> jest.mock('${relativePath}')`);
    modified = true;
    return `jest.mock('${relativePath}'`;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('  ✅ Archivo actualizado');
  } else {
    console.log('  ⏭️  Sin cambios necesarios');
  }
}

// Función para buscar archivos recursivamente
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Ignorar node_modules, .next, etc.
        if (!['node_modules', '.next', 'dist', 'build', 'coverage'].includes(item)) {
          traverse(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Ejecutar el script
console.log('🔧 Iniciando corrección de imports...');
console.log('==================================================');

const projectRoot = process.cwd();
const allFiles = findFiles(projectRoot);

// Filtrar solo archivos que probablemente tengan imports con '@/'
const filesToProcess = allFiles.filter(file => {
  const content = fs.readFileSync(file, 'utf8');
  return content.includes('@/');
});

console.log(`📁 Encontrados ${filesToProcess.length} archivos con imports '@/'`);
console.log('==================================================');

filesToProcess.forEach(processFile);

console.log('==================================================');
console.log('✅ Proceso completado');