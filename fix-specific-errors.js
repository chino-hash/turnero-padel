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
      fixSpecificErrors(filePath);
    }
  });
}

// Función para corregir errores específicos
function fixSpecificErrors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Corregir propiedades cancelledBy que no existen
  if (content.includes('cancelledBy:')) {
    content = content.replace(/\s*cancelledBy:\s*[^,\n]+,?\n?/g, '');
    modified = true;
  }
  
  // Corregir tipos de mock objects comunes
  const mockObjectFixes = [
    // Corregir expect.any() sin tipo
    { pattern: /expect\.any\(\)/g, replacement: 'expect.any(Object)' },
    // Corregir jest.fn() sin tipo en mocks
    { pattern: /jest\.fn\(\)(?!\s*\.mockResolvedValue|\s*\.mockRejectedValue|\s*\.mockReturnValue)/g, replacement: 'jest.fn() as jest.MockedFunction<any>' },
    // Corregir variables sin tipo en describe/it
    { pattern: /let\s+(\w+)\s*;/g, replacement: 'let $1: any;' },
  ];
  
  mockObjectFixes.forEach(fix => {
    if (fix.pattern.test(content)) {
      content = content.replace(fix.pattern, fix.replacement);
      modified = true;
    }
  });
  
  // Corregir imports faltantes comunes
  const needsJestTypes = content.includes('jest.') && !content.includes('@types/jest');
  if (needsJestTypes && !content.includes('/// <reference types="@types/jest" />')) {
    content = '/// <reference types="@types/jest" />\n' + content;
    modified = true;
  }
  
  // Corregir parámetros de callback sin tipo
  const callbackPattern = /\.(forEach|map|filter|find)\(\s*(\w+)\s*=>/g;
  if (callbackPattern.test(content)) {
    content = content.replace(callbackPattern, '.$1(($2: any) =>');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed specific errors in: ${filePath}`);
  }
}

// Procesar directorios de prueba
console.log('Fixing specific TypeScript errors in test files...');
processDirectory('./__tests__');
processDirectory('./tests');
console.log('Done fixing specific errors!');