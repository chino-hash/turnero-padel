const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Función para calcular la ruta relativa desde un archivo de test
function calculateRelativePath(testFilePath, importPath) {
  // Remover el prefijo '@/'
  const cleanImportPath = importPath.replace(/^@\//, '');
  
  // Obtener el directorio del archivo de test
  const testDir = path.dirname(testFilePath);
  
  // Calcular la ruta relativa desde el directorio del test hasta la raíz del proyecto
  const relativePath = path.relative(testDir, '.');
  
  // Combinar con el path del import
  const finalPath = path.join(relativePath, cleanImportPath).replace(/\\/g, '/');
  
  // Asegurar que empiece con './' si no empieza con '../'
  return finalPath.startsWith('../') ? finalPath : './' + finalPath;
}

// Función para procesar un archivo
function processFile(filePath) {
  console.log(`Procesando: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Buscar todos los imports que usan '@/' (incluyendo multilínea)
  const importRegex = /import\s+[\s\S]*?from\s+['"]@\/([^'"]+)['"]/g;
  
  content = content.replace(importRegex, (match, importPath) => {
    const relativePath = calculateRelativePath(filePath, '@/' + importPath);
    const newImport = match.replace(`@/${importPath}`, relativePath);
    console.log(`  ${match} -> ${newImport}`);
    modified = true;
    return newImport;
  });
  
  // También buscar jest.mock calls
  const mockRegex = /jest\.mock\(['"]@\/([^'"]+)['"]/g;
  
  content = content.replace(mockRegex, (match, importPath) => {
    const relativePath = calculateRelativePath(filePath, '@/' + importPath);
    const newMock = match.replace(`@/${importPath}`, relativePath);
    console.log(`  ${match} -> ${newMock}`);
    modified = true;
    return newMock;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Archivo actualizado`);
  } else {
    console.log(`  ⏭️  Sin cambios necesarios`);
  }
}

// Buscar todos los archivos de test
const testFiles = glob.sync('__tests__/**/*.{ts,tsx,js,jsx}', {
  ignore: ['__tests__/mocks/**', '__tests__/utils/**', '__tests__/setup/**']
});

console.log(`Encontrados ${testFiles.length} archivos de test`);
console.log('='.repeat(50));

// Procesar cada archivo
testFiles.forEach(processFile);

console.log('='.repeat(50));
console.log('✅ Proceso completado');