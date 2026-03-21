import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsBoolean, IsInt, IsOptional, IsString } from 'class-validator'

export class CreateDemoJpDto {
  @ApiProperty({ example: '1001', required: false })
  @IsString()
  @IsOptional()
  demo_jp_id?: string

  @ApiProperty({ example: 'Demo JP Master Template' })
  @IsString()
  title: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  email?: string

  @ApiProperty({ required: false })
  @IsOptional()
  age?: number

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  brand_color?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string

  @ApiProperty({ required: false, type: 'array' })
  @IsArray()
  @IsOptional()
  flags?: string[]

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean

  @ApiProperty({ required: false })
  @IsOptional()
  published_date?: string

  @ApiProperty({ required: false })
  @IsOptional()
  published_at?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  summary?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  content?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  thumbnail?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  thumbnail_gen?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  thumbnail_alt?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  intro_video?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  intro_video_gen?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  attachment?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  attachment_gen?: string

  @ApiProperty({ example: 'active', required: false, default: 'active' })
  @IsString()
  @IsOptional()
  obj_status?: string

  @ApiProperty({ example: 'draft', required: false, default: 'draft' })
  @IsString()
  @IsOptional()
  obj_state?: string

  @ApiProperty({ example: 'en', required: false, default: 'en' })
  @IsString()
  @IsOptional()
  obj_lang?: string

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  obj_rev?: number

  @ApiProperty({ example: 1001, required: false })
  @IsString()
  @IsOptional()
  obj_content_id?: string

  @ApiProperty({ example: 10 })
  @IsInt()
  obj_created_by: number

  @ApiProperty({ example: 11, required: false })
  @IsInt()
  @IsOptional()
  obj_modified_by?: number

  @ApiProperty({ example: 12, required: false })
  @IsInt()
  @IsOptional()
  obj_published_by?: number

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  publish?: boolean

  @ApiProperty({ required: false, type: 'array' })
  @IsArray()
  @IsOptional()
  __child_demo_jp_child_list_0_0?: Record<string, any>[]

  @ApiProperty({ required: false, type: 'array' })
  @IsArray()
  @IsOptional()
  __gallery_demo_jp_gallery?: Record<string, any>[]

  @ApiProperty({ required: false, type: 'array' })
  @IsArray()
  @IsOptional()
  __gallery_korea_gallery?: Record<string, any>[]
}
