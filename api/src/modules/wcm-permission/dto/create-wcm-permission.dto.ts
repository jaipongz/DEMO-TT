import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWcmPermissionDto {
  @ApiProperty({ example: 'article.create', description: 'Permission name (module.action)' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Can create articles', description: 'Permission description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'article', description: 'Module name' })
  @IsString()
  module: string;

  @ApiProperty({ example: 'Article', description: 'Display name of module', required: false })
  @IsString()
  @IsOptional()
  module_name?: string;

  @ApiProperty({ example: 'create', description: 'Action (create, read, update, delete)' })
  @IsString()
  action: string;
}
