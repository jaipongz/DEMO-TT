import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WcmUser } from './wcm-user.entity';
import { WcmUserService } from './wcm-user.service';
import { WcmUserController } from './wcm-user.controller';
import { WcmRole } from '../wcm-role/wcm-role.entity';
import { WcmPermission } from '../wcm-permission/wcm-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WcmUser, WcmRole, WcmPermission])],
  controllers: [WcmUserController],
  providers: [WcmUserService],
  exports: [WcmUserService],
})
export class WcmUserModule {}
