import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WcmRole } from './wcm-role.entity';
import { WcmRoleService } from './wcm-role.service';
import { WcmRoleController } from './wcm-role.controller';
import { WcmPermission } from '../wcm-permission/wcm-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WcmRole, WcmPermission])],
  controllers: [WcmRoleController],
  providers: [WcmRoleService],
  exports: [WcmRoleService],
})
export class WcmRoleModule {}
