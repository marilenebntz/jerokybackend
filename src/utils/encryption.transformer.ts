import { ValueTransformer } from 'typeorm';
import * as crypto from 'crypto';

export class EncryptionTransformer implements ValueTransformer {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;

  constructor() {
    // Key must be exactly 32 bytes for aes-256-cbc.
    const rawKey =
      process.env.ENCRYPTION_KEY || 'default-secret-key-32-chars-long!';
    this.key = crypto.scryptSync(rawKey, 'salt', 32);
  }

  to(value: string | null): string | null {
    if (!value) return null;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  from(value: string | null): string | null {
    if (!value) return null;
    try {
      const parts = value.split(':');
      if (parts.length !== 2) return null;
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = Buffer.from(parts[1], 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      let decrypted = decipher.update(encryptedText, undefined as any, 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      console.error('Failed to decrypt database field:', err.message);
      return null;
    }
  }
}
