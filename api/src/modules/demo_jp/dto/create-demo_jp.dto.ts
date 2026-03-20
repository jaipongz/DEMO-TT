import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateDemoJpDto {
  @ApiProperty({ example: '1001', required: false })
  @IsString()
  @IsOptional()
  demo_jp_id?: string;

  @ApiProperty({ required: true, example: 'title' })
  @IsString()
  title: string;

  @ApiProperty({ required: false, example: 'email' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false, example: 'age' })
  @IsInt()
  @IsOptional()
  age?: number;

  @ApiProperty({ required: false, example: 'brand_color' })
  @IsString()
  @IsOptional()
  brand_color?: string;

  @ApiProperty({ required: false, example: 'published_date' })
  @IsString()
  @IsOptional()
  published_date?: string;

  @ApiProperty({ required: false, example: 'published_at' })
  @IsString()
  @IsOptional()
  published_at?: string;

  @ApiProperty({ required: true, example: 'category' })
  @IsString()
  category: string;

  @ApiProperty({ required: true, example: 'province' })
  @IsString()
  province: string;

  @ApiProperty({ required: false, example: 'article' })
  @IsString()
  @IsOptional()
  article?: string;

  @ApiProperty({ required: false, example: 'home_banner_tags' })
  @IsArray()
  @IsOptional()
  home_banner_tags?: string[];

  @ApiProperty({ required: false, example: 'status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false, example: 'flags' })
  @IsArray()
  @IsOptional()
  flags?: string[];

  @ApiProperty({ required: false, example: 'is_active' })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({ required: false, example: 'summary' })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiProperty({ required: false, example: 'content' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ required: false, example: 'thumbnail' })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiProperty({ required: false, example: 'intro_video' })
  @IsString()
  @IsOptional()
  intro_video?: string;

  @ApiProperty({ required: false, example: 'attachment' })
  @IsString()
  @IsOptional()
  attachment?: string;

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

  @ApiProperty({ required: false, type: 'array' })
  @IsArray()
  @IsOptional()
  __child_demo_jp_child?: Record<string, any>[];


  @ApiProperty({ required: false, type: 'array' })
  @IsArray()
  @IsOptional()
  __gallery_demo_jp_gallery?: Record<string, any>[];

  @ApiProperty({ required: false, type: 'array' })
  @IsArray()
  @IsOptional()
  __gallery_korea_gallery?: Record<string, any>[];

}
