import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException('User has no roles');
    }

    const hasRole = requiredRoles.some((role) =>
      user.roles.some((userRole: any) => userRole.name === role),
    );

    if (!hasRole) {
      throw new ForbiddenException('User does not have required role');
    }

    return true;
  }
}
