import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWcmRoleDto {
  @ApiProperty({ example: 'admin', description: 'Role name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Administrator role', description: 'Role description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'Assigned permission IDs',
    required: false,
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  permissionIds?: number[];
}
