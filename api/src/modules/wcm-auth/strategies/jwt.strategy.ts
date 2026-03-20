import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { WcmAuthService } from '../wcm-auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: WcmAuthService, private configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET') || 'your-secret-key';
    console.log('[JWT] secret length:', secret.length);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    console.log('[JWT] validate payload:', { sub: payload?.sub, email: payload?.email })
    return this.authService.validateUser(payload);
  }
}
