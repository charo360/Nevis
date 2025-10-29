// Token encryption utilities for secure storage
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-change-in-production';
const ALGORITHM = 'aes-256-gcm';

// Ensure encryption key is 32 characters
function getEncryptionKey(): string {
  if (ENCRYPTION_KEY.length < 32) {
    console.warn('⚠️  ENCRYPTION_KEY is too short. Using padded key.');
    return ENCRYPTION_KEY.padEnd(32, '0');
  }
  if (ENCRYPTION_KEY.length > 32) {
    return ENCRYPTION_KEY.substring(0, 32);
  }
  return ENCRYPTION_KEY;
}

/**
 * Encrypt sensitive data before storing in database
 */
export function encryptToken(text: string): string {
  try {
    const key = Buffer.from(getEncryptionKey(), 'utf8');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:authTag:encrypted
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypt sensitive data from database
 */
export function decryptToken(encryptedText: string): string {
  try {
    const key = Buffer.from(getEncryptionKey(), 'utf8');
    const parts = encryptedText.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format');
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt token');
  }
}

/**
 * Check if a string is encrypted (has the expected format)
 */
export function isEncrypted(text: string): boolean {
  return text.includes(':') && text.split(':').length === 3;
}

/**
 * Safely encrypt a token (only if not already encrypted)
 */
export function safeEncryptToken(token: string): string {
  if (!token) return token;
  if (isEncrypted(token)) return token;
  return encryptToken(token);
}

/**
 * Safely decrypt a token (only if encrypted)
 */
export function safeDecryptToken(token: string): string {
  if (!token) return token;
  if (!isEncrypted(token)) return token;
  return decryptToken(token);
}

