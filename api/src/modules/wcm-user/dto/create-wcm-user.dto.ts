import { IsArray, IsEmail, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWcmUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Theerapong O', description: 'Display name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Theerapong', description: 'First name' })
  @IsString()
  firstname: string;

  @ApiProperty({ example: 'O', description: 'Last name' })
  @IsString()
  lastname: string;

  @ApiProperty({ example: 'Asia/Bangkok', description: 'IANA timezone', required: false })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ example: 'password123', description: 'User password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  password: string;

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
