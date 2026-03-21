import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({ example: '1001', required: false })
  @IsString()
  @IsOptional()
  article_id?: string;

  @ApiProperty({ required: true, example: 'title' })
  @IsString()
  title: string;





  @ApiProperty({ required: false, example: 'short_description' })
  @IsString()
  @IsOptional()
  short_description?: string;





  @ApiProperty({ required: false, example: 'thumbnail' })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiProperty({ required: false, example: 'thumbnail_gen' })
  @IsString()
  @IsOptional()
  thumbnail_gen?: string;

  @ApiProperty({ required: false, example: 'thumbnail_alt' })
  @IsString()
  @IsOptional()
  thumbnail_alt?: string;




  @ApiProperty({ example: 'active', required: false, default: 'active' })
  @IsString()
  @IsOptional()
  obj_status?: string;

  @ApiProperty({ example: 'draft', required: false, default: 'draft' })
  @IsString()
  @IsOptional()
  obj_state?: string;

  @ApiProperty({ example: 'en', required: false, default: 'en' })
  @IsString()
  @IsOptional()
  obj_lang?: string;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  obj_rev?: number;

  @ApiProperty({ example: 1001, required: false })
  @IsString()
  @IsOptional()
  obj_content_id?: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  obj_created_by: number;

  @ApiProperty({ example: 11, required: false })
  @IsInt()
  @IsOptional()
  obj_modified_by?: number;

  @ApiProperty({ example: 12, required: false })
  @IsInt()
  @IsOptional()
  obj_published_by?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  publish?: boolean;


}
