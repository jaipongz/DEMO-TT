import { IsArray, IsBoolean, IsEmail, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWcmUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'John Doe', description: 'User name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'John', description: 'First name', required: false })
  @IsString()
  @IsOptional()
  firstname?: string;

  @ApiProperty({ example: 'Doe', description: 'Last name', required: false })
  @IsString()
  @IsOptional()
  lastname?: string;

  @ApiProperty({ example: 'Asia/Bangkok', description: 'IANA timezone', required: false })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ example: 'password123', description: 'User password (min 6 characters)', required: false })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiProperty({ example: true, description: 'Is user active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: [1], description: 'Assigned role IDs', required: false, type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  roleIds?: number[];

  @ApiProperty({ example: [2, 10], description: 'Assigned individual permission IDs', required: false, type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  permissionIds?: number[];
}
