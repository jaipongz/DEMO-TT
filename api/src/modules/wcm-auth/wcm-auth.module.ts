import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WcmAuthService } from './wcm-auth.service';
import { WcmAuthController } from './wcm-auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { WcmUserModule } from '../wcm-user/wcm-user.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '24h' },
      }),
    }),
    WcmUserModule,
  ],
  controllers: [WcmAuthController],
  providers: [WcmAuthService, JwtStrategy],
  exports: [WcmAuthService],
})
export class WcmAuthModule {}
