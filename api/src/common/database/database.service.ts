import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(private dataSource: DataSource) {}

  getDataSource(): DataSource {
    return this.dataSource;
  }

  getDatabaseType(): string {
    return this.dataSource.options.type;
  }

  isConnected(): boolean {
    return this.dataSource.isInitialized;
  }

  async getHealth() {
    if (!this.isConnected()) {
      return {
        status: 'disconnected',
        message: 'Database connection failed',
        type: this.getDatabaseType(),
      };
    }
    return {
      status: 'connected',
      message: 'Database is healthy',
      type: this.getDatabaseType(),
    };
  }
}
