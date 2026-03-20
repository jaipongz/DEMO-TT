import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	handleRequest(err: any, user: any, info: any) {
		if (err || !user) {
			const reason = err?.message || info?.message || 'Unauthorized'
			console.log('[JWT] guard reject:', reason)
			throw err || new UnauthorizedException(reason)
		}
		return user
	}
}
