import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface SiteSettings {
  siteName: string;
  faviconUrl: string;
  googleApiKey: string;
  googleOAuthClientId: string;
  googleOAuthClientSecret: string;
  passwordLifetimeDays: number;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  maxRevision: number;
  actionLogsRetention: '1_month' | '3_month' | '6_month' | '9_month' | '12_month' | 'never';
  locale: string;
  timezone: string;
  maintenanceMode: 'on' | 'off';
  dynamicConfigs: Array<{ key: string; value: string }>;
  updatedAt?: string;
}

@Injectable()
export class WcmSiteSettingService {
  private readonly settingsPath = path.join(process.cwd(), 'config', 'site-settings.json');

  private readonly defaults: SiteSettings = {
    siteName: 'Content Management System',
    faviconUrl: '',
    googleApiKey: '',
    googleOAuthClientId: '',
    googleOAuthClientSecret: '',
    passwordLifetimeDays: 90,
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    maxRevision: 5,
    actionLogsRetention: '6_month',
    locale: 'en',
    timezone: 'Asia/Bangkok',
    maintenanceMode: 'off',
    dynamicConfigs: [{ key: 'STABLE_API_KEY', value: '' }],
  };

  private async ensureFile(): Promise<void> {
    const dir = path.dirname(this.settingsPath);
    try {
      await fs.access(this.settingsPath);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.settingsPath, JSON.stringify(this.defaults, null, 2));
    }
  }

  async getSettings(): Promise<SiteSettings> {
    await this.ensureFile();
    const raw = await fs.readFile(this.settingsPath, 'utf-8');
    const parsed = JSON.parse(raw || '{}');
    return { ...this.defaults, ...parsed };
  }

  async saveSettings(input: Partial<SiteSettings>): Promise<SiteSettings> {
    await this.ensureFile();
    const next: SiteSettings = {
      ...this.defaults,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    await fs.writeFile(this.settingsPath, JSON.stringify(next, null, 2));
    return next;
  }
}
