import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WcmUserService } from '../wcm-user/wcm-user.service';
import { LoginDto } from './dto/login.dto';
import { WcmUser } from '../wcm-user/wcm-user.entity';

@Injectable()
export class WcmAuthService {
  constructor(
    private cmsUserService: WcmUserService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim();
    const password = loginDto.password.trim();
    
    // console.log('🔐 Login attempt:', { email });
    
    const user = await this.cmsUserService.findByEmail(email);
    // console.log('👤 User found:', user ? `${user.email}` : 'NOT FOUND');

    if (!user) {
      // console.log('❌ User not found in database');
      return { message: 'Invalid credentials' };
    }

    const isPasswordValid = await this.cmsUserService.validatePassword(
      password,
      user.password,
    );
    // console.log('🔑 Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      // console.log('❌ Password mismatch');
      return { message: 'Invalid credentials' };
    }

    if (!user.isActive) {
      // console.log('❌ User account inactive');
      return { message: 'User account is inactive' };
    }

    // console.log('✅ Login successful for:', user.email);

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map((role) => ({
        id: role.id,
        name: role.name,
        permissions: role.permissions.map((p) => ({
          id: p.id,
          name: p.name,
          module: p.module,
          action: p.action,
        })),
      })),
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    };
  }

  async validateUser(payload: any): Promise<WcmUser | null> {
    const userId = Number(payload?.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return null;
    }

    const user = await this.cmsUserService.findOne(userId);
    // console.log('[JWT] validateUser result:', { sub: payload?.sub, found: !!user });
    return user;
  }
}
