const fs = require('fs');
const path = require('path');

// Función para procesar archivos recursivamente
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.test.ts') || file.endsWith('.test.tsx') || file.endsWith('.spec.ts') || file.endsWith('.spec.tsx')) {
      fixTestFile(filePath);
    }
  });
}

// Función para corregir errores comunes en archivos de prueba
function fixTestFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Corregir catch (error) -> catch (error: unknown)
  const catchPattern = /catch\s*\(\s*error\s*\)/g;
  if (catchPattern.test(content)) {
    content = content.replace(catchPattern, 'catch (error: unknown)');
    modified = true;
  }
  
  // Corregir error.message -> (error as Error).message
  const errorMessagePattern = /(?<!\(error as Error\))error\.message/g;
  if (errorMessagePattern.test(content)) {
    content = content.replace(errorMessagePattern, '(error as Error).message');
    modified = true;
  }
  
  // Corregir console.log con error -> console.log con (error as Error)
  const consoleErrorPattern = /console\.(log|error|warn)\([^)]*error(?!\.message)[^)]*\)/g;
  const matches = content.match(consoleErrorPattern);
  if (matches) {
    matches.forEach(match => {
      if (!match.includes('(error as Error)') && !match.includes('error:')) {
        const fixed = match.replace(/\berror\b(?!\.message)/, '(error as Error)');
        content = content.replace(match, fixed);
        modified = true;
      }
    });
  }
  
  // Corregir arrays implícitos any[]
  const implicitArrayPattern = /const\s+(\w+)\s*=\s*\[\]/g;
  if (implicitArrayPattern.test(content)) {
    content = content.replace(implicitArrayPattern, 'const $1: any[] = []');
    modified = true;
  }
  
  // Corregir variables let implícitas
  const implicitLetPattern = /let\s+(\w+)\s*;/g;
  if (implicitLetPattern.test(content)) {
    content = content.replace(implicitLetPattern, 'let $1: any;');
    modified = true;
  }
  
  // Corregir parámetros de función sin tipo
  const functionParamPattern = /\((\w+)\)\s*=>/g;
  if (functionParamPattern.test(content)) {
    content = content.replace(functionParamPattern, '($1: any) =>');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

// Procesar directorios de prueba
console.log('Fixing test files...');
processDirectory('./__tests__');
processDirectory('./tests');
console.log('Done!');