import { PartialType } from '@nestjs/swagger';
import { CreateWcmRoleDto } from './create-wcm-role.dto';

export class UpdateWcmRoleDto extends PartialType(CreateWcmRoleDto) {}
