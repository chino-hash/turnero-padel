const fs = require('fs');
const path = require('path');

// Función para aplicar correcciones específicas
function applyFixes(content, filePath) {
  let fixed = content;
  let hasChanges = false;

  // 1. Corregir Element implicitly has an 'any' type - indexación con string
  const indexAccessPattern = /return styles\[prop\];/g;
  if (indexAccessPattern.test(fixed)) {
    fixed = fixed.replace(/return styles\[prop\];/g, 'return (styles as any)[prop];');
    hasChanges = true;
  }

  // 2. Corregir variables implícitamente 'any[]' - arrays vacíos
  const implicitArrayPattern = /let (\w+) = \[\];/g;
  if (implicitArrayPattern.test(fixed)) {
    fixed = fixed.replace(/let (\w+) = \[\];/g, 'let $1: any[] = [];');
    hasChanges = true;
  }

  // 3. Corregir parámetros de función sin tipo
  const functionParamPattern = /\((\w+)\) => /g;
  if (functionParamPattern.test(fixed)) {
    fixed = fixed.replace(/\((\w+)\) => /g, '($1: any) => ');
    hasChanges = true;
  }

  // 4. Corregir variables let implícitas
  const letVariablePattern = /let (\w+);/g;
  if (letVariablePattern.test(fixed)) {
    fixed = fixed.replace(/let (\w+);/g, 'let $1: any;');
    hasChanges = true;
  }

  // 5. Corregir expect.any() sin tipo
  const expectAnyPattern = /expect\.any\(\)/g;
  if (expectAnyPattern.test(fixed)) {
    fixed = fixed.replace(/expect\.any\(\)/g, 'expect.any(Object)');
    hasChanges = true;
  }

  // 6. Corregir jest.fn() sin tipo
  const jestFnPattern = /jest\.fn\(\)/g;
  if (jestFnPattern.test(fixed)) {
    fixed = fixed.replace(/jest\.fn\(\)/g, 'jest.fn() as any');
    hasChanges = true;
  }

  // 7. Corregir acceso a propiedades dinámicas
  const dynamicPropPattern = /(\w+)\[(\w+)\]/g;
  if (dynamicPropPattern.test(fixed) && !fixed.includes('as any')) {
    fixed = fixed.replace(/(\w+)\[(\w+)\]/g, '($1 as any)[$2]');
    hasChanges = true;
  }

  // 8. Corregir trim().length comparisons
  const trimLengthPattern = /\.trim\(\)\.length > 0/g;
  if (trimLengthPattern.test(fixed)) {
    fixed = fixed.replace(/\.trim\(\)\.length > 0/g, '.trim().length > 0');
    hasChanges = true;
  }

  return { fixed, hasChanges };
}

// Función para procesar archivos
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { fixed, hasChanges } = applyFixes(content, filePath);
    
    if (hasChanges) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      console.log(`✅ Corregido: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return false;
  }
}

// Función para buscar archivos de prueba
function findTestFiles(dir) {
  const files = [];
  
  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDir(fullPath);
      } else if (stat.isFile() && (item.endsWith('.test.ts') || item.endsWith('.test.tsx') || item.endsWith('.spec.ts'))) {
        files.push(fullPath);
      }
    }
  }
  
  scanDir(dir);
  return files;
}

// Ejecutar el script
const testDirs = ['__tests__', 'tests'];
let totalFixed = 0;

console.log('🔧 Iniciando corrección de errores restantes de TypeScript...');

for (const testDir of testDirs) {
  if (fs.existsSync(testDir)) {
    console.log(`\n📁 Procesando directorio: ${testDir}`);
    const files = findTestFiles(testDir);
    
    for (const file of files) {
      if (processFile(file)) {
        totalFixed++;
      }
    }
  }
}

console.log(`\n✨ Proceso completado. Archivos corregidos: ${totalFixed}`);