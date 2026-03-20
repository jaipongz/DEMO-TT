import { IsString, IsOptional, IsInt, IsBoolean, IsArray } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateHomeBannerDto {
  @ApiProperty({ example: '1001', required: false })
  @IsString()
  @IsOptional()
  homeBannerId?: string

  @ApiProperty({ example: 'Hero Banner' })
  @IsString()
  title: string

  @ApiProperty({ example: 'banner.jpg', required: false })
  @IsString()
  @IsOptional()
  banner?: string

  @ApiProperty({ example: 'a1b2c3d4e5', required: false })
  @IsString()
  @IsOptional()
  bannerGen?: string

  @ApiProperty({ example: 'banner', required: false })
  @IsString()
  @IsOptional()
  bannerAlt?: string

  @ApiProperty({ example: 'banner.mp4', required: false })
  @IsString()
  @IsOptional()
  bannerVideo?: string

  @ApiProperty({ example: 'z9y8x7w6v5', required: false })
  @IsString()
  @IsOptional()
  bannerVideoGen?: string

  @ApiProperty({ example: 'image' })
  @IsString()
  mode: string

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

  @ApiProperty({
    required: false,
    type: 'array',
    example: [{ title: 'Detail 1', file: 'slide-1.jpg', file_gen: 'abc123xyz1', detail: '<p>Detail</p>' }],
  })
  @IsArray()
  @IsOptional()
  __child_home_banner_detail_0_0?: Record<string, any>[]

  @ApiProperty({
    required: false,
    type: 'array',
    example: [{ file: 'gallery-1.jpg', file_gen: 'abc123xyz1', type: 'image' }],
  })
  @IsArray()
  @IsOptional()
  __gallery_home_banner_gallery?: Record<string, any>[]
}
