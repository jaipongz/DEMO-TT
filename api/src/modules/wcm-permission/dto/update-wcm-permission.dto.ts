import { PartialType } from '@nestjs/swagger';
import { CreateWcmPermissionDto } from './create-wcm-permission.dto';

export class UpdateWcmPermissionDto extends PartialType(CreateWcmPermissionDto) {}
