import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseType = (configService.get('DATABASE_TYPE') || 'mysql') as any;
        const baseConfig = {
          entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
          synchronize: configService.get('NODE_ENV') !== 'production',
          logging: String(configService.get('DATABASE_LOGGING') || '').toLowerCase() === 'true',
        };

        const typeConfigs = {
          postgres: {
            type: 'postgres' as const,
            host: configService.get('DATABASE_HOST') || 'localhost',
            port: parseInt(configService.get('DATABASE_PORT') || '5432'),
            username: configService.get('DATABASE_USER') || 'postgres',
            password: configService.get('DATABASE_PASSWORD') || 'password',
            database: configService.get('DATABASE_NAME') || 'nestjs_db',
          },
          mysql: {
            type: 'mysql' as const,
            host: configService.get('DATABASE_HOST') || 'localhost',
            port: parseInt(configService.get('DATABASE_PORT') || '3306'),
            username: configService.get('DATABASE_USER') || 'root',
            password: configService.get('DATABASE_PASSWORD') || '',
            database: configService.get('DATABASE_NAME') || 'nestjs_db',
            timezone: 'Z',
          },
          mariadb: {
            type: 'mariadb' as const,
            host: configService.get('DATABASE_HOST') || 'localhost',
            port: parseInt(configService.get('DATABASE_PORT') || '3306'),
            username: configService.get('DATABASE_USER') || 'root',
            password: configService.get('DATABASE_PASSWORD') || 'password',
            database: configService.get('DATABASE_NAME') || 'nestjs_db',
            timezone: 'Z',
          },
          sqlite: {
            type: 'sqlite' as const,
            database: configService.get('DATABASE_PATH') || './data/database.sqlite',
          },
          mongodb: {
            type: 'mongodb' as const,
            url: configService.get('DATABASE_URL') || 'mongodb://localhost:27017/nestjs_db',
          },
        };

        const selectedConfig = typeConfigs[databaseType] || typeConfigs.mysql;

        return {
          ...baseConfig,
          ...selectedConfig,
        };
      },
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
