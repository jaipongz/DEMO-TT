import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WcmPermission } from './wcm-permission.entity';
import { WcmPermissionService } from './wcm-permission.service';
import { WcmPermissionController } from './wcm-permission.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WcmPermission])],
  controllers: [WcmPermissionController],
  providers: [WcmPermissionService],
  exports: [WcmPermissionService],
})
export class WcmPermissionModule {}
