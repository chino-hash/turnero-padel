/**
 * Utilidades para encriptar y desencriptar credenciales sensibles
 * Usa AES-256-GCM para encriptación simétrica segura
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes para AES
const AUTH_TAG_LENGTH = 16; // 16 bytes para GCM
const SALT_LENGTH = 64;

/**
 * Obtiene la clave de encriptación desde las variables de entorno
 * Debe ser una clave hexadecimal de 64 caracteres (32 bytes)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY no está configurada. Debe ser una clave hexadecimal de 64 caracteres (32 bytes).');
  }

  // Validar que sea hexadecimal
  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY debe ser una clave hexadecimal de 64 caracteres (32 bytes).');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encripta un texto plano usando AES-256-GCM
 * 
 * @param plaintext - El texto a encriptar
 * @returns String en formato: iv:authTag:encryptedData (todos en hex)
 */
export function encryptCredential(plaintext: string): string {
  if (!plaintext || plaintext.length === 0) {
    throw new Error('El texto a encriptar no puede estar vacío');
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Retornar formato: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('[Encryption] Error encriptando credencial:', error);
    throw new Error(`Error al encriptar credencial: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Desencripta un texto encriptado usando AES-256-GCM
 * 
 * @param encrypted - String en formato: iv:authTag:encryptedData (todos en hex)
 * @returns El texto desencriptado
 */
export function decryptCredential(encrypted: string): string {
  if (!encrypted || encrypted.length === 0) {
    throw new Error('El texto encriptado no puede estar vacío');
  }

  try {
    const parts = encrypted.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Formato de texto encriptado inválido. Debe ser: iv:authTag:encryptedData');
    }

    const [ivHex, authTagHex, encryptedData] = parts;
    
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[Encryption] Error desencriptando credencial:', error);
    
    // No revelar detalles del error por seguridad
    if (error instanceof Error && error.message.includes('bad decrypt')) {
      throw new Error('Error al desencriptar: clave de encriptación inválida o datos corruptos');
    }
    
    throw new Error(`Error al desencriptar credencial: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Genera una nueva clave de encriptación (para configuración inicial)
 * 
 * @returns String hexadecimal de 64 caracteres (32 bytes)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}



