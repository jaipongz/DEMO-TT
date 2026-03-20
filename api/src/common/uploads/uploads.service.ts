import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

@Injectable()
export class UploadsService {
  private readonly stockDir = path.join(process.cwd(), 'public', 'stock');

  private generateGen(length = 10): string {
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = randomBytes(length);
    let out = '';

    for (let i = 0; i < length; i++) {
      out += alphabet[bytes[i] % alphabet.length];
    }

    return out;
  }

  private sanitizeModule(input: string): string {
    return String(input || '')
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .trim();
  }

  private sanitizeFileName(input: string): string {
    const baseName = path.basename(String(input || '').trim());
    return baseName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^\.+/, '')
      .slice(0, 180);
  }

  private getStoredFileName(gen: string, fileName: string): string {
    return `${gen}__${fileName}`;
  }

  async saveFile(file: any, module: string): Promise<{ url: string; path: string; gen: string; fileName: string }> {
    const safeModule = this.sanitizeModule(module);
    if (!safeModule) {
      throw new Error('Invalid module name');
    }

    // Create module directory if not exists
    const moduleDir = path.join(this.stockDir, safeModule);
    try {
      await fs.mkdir(moduleDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directory:', error);
    }

    // Generate unique filename
    const gen = this.generateGen(10);
    const safeOriginalName = this.sanitizeFileName(file.originalname || 'file.bin') || 'file.bin';
    const storedName = this.getStoredFileName(gen, safeOriginalName);
    const filePath = path.join(moduleDir, storedName);

    // Write file
    try {
      await fs.writeFile(filePath, file.buffer);
    } catch (error) {
      console.error('Error writing file:', error);
      throw new Error('Failed to save file');
    }

    // Return relative URL for frontend
    const encodedName = encodeURIComponent(safeOriginalName);
    const url = `/stock/${safeModule}/${gen}/${encodedName}`;
    return { url, path: filePath, gen, fileName: safeOriginalName };
  }

  async resolveFilePath(module: string, gen: string, fileName: string): Promise<string | null> {
    const safeModule = this.sanitizeModule(module);
    const safeGen = String(gen || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
    const safeFileName = this.sanitizeFileName(decodeURIComponent(fileName || ''));

    if (!safeModule || !safeGen || !safeFileName) {
      return null;
    }

    const moduleDir = path.join(this.stockDir, safeModule);
    const storedName = this.getStoredFileName(safeGen, safeFileName);
    const filePath = path.join(moduleDir, storedName);

    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        return null;
      }
      return filePath;
    } catch {
      return null;
    }
  }
}
