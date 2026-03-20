import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateArticleDto {
  @ApiProperty({ example: '1001', description: 'Override articles_id (optional)', required: false })
  @IsString()
  @IsOptional()
  articlesId?: string

  @ApiProperty({ example: 'Article Title', description: 'The title of the article' })
  @IsString()
  title: string

  @ApiProperty({ example: 'draft', description: 'Workflow status', required: false, default: 'draft' })
  @IsString()
  @IsOptional()
  obj_status?: string

  @ApiProperty({ example: 'draft', description: 'State flag', required: false, default: 'draft' })
  @IsString()
  @IsOptional()
  obj_state?: string

  @ApiProperty({ example: 'en', description: 'Content language', required: false, default: 'en' })
  @IsString()
  @IsOptional()
  obj_lang?: string

  @ApiProperty({ example: 1, description: 'Revision number', required: false, default: 1 })
  @IsInt()
  @IsOptional()
  obj_rev?: number

  @ApiProperty({ example: 1001, description: 'Content group ID', required: false })
  @IsString()
  @IsOptional()
  obj_content_id?: string

  @ApiProperty({ example: 'John Doe', description: 'The author of the article' })
  @IsString()
  author: string

  @ApiProperty({ example: '2024-01-01', description: 'Display date string' })
  @IsString()
  date: string

  @ApiProperty({ example: 'Article content here...', description: 'The content of the article' })
  @IsString()
  content: string

  @ApiProperty({ example: '<p>Rich content</p>', description: 'WYSIWYG HTML content' })
  @IsString()
  @IsOptional()
  contentWysiwyg?: string

  @ApiProperty({ example: '#ff6600', description: 'Brand color hex', required: false })
  @IsString()
  @IsOptional()
  brandColor?: string

  @ApiProperty({ example: 'gen123', description: 'Thumbnail generation key' })
  @IsString()
  thumbnailGen: string

  @ApiProperty({ example: 'thumb.jpg', description: 'Thumbnail file name/path' })
  @IsString()
  thumbnail: string

  @ApiProperty({ example: 'thumb.jpg', description: 'Legacy alias for thumbnail', required: false })
  @IsString()
  @IsOptional()
  thumbnailName?: string

  @ApiProperty({ example: 'alt text', description: 'Thumbnail alt text', required: false })
  @IsString()
  @IsOptional()
  thumbnailAlt?: string

  @ApiProperty({ example: 'video.mp4', description: 'Video file name', required: false })
  @IsString()
  @IsOptional()
  video?: string

  @ApiProperty({ example: 'gen456', description: 'Video generation key', required: false })
  @IsString()
  @IsOptional()
  videoGen?: string

  @ApiProperty({ example: 'document.pdf', description: 'File name/path', required: false })
  @IsString()
  @IsOptional()
  file?: string

  @ApiProperty({ example: 'gen789', description: 'File generation key', required: false })
  @IsString()
  @IsOptional()
  fileGen?: string

  @ApiProperty({ example: 'document.pdf', description: 'Legacy alias for file', required: false })
  @IsString()
  @IsOptional()
  document?: string

  @ApiProperty({ example: 10, description: 'Creator user id' })
  @IsInt()
  obj_created_by: number

  @ApiProperty({ example: 11, description: 'Last modifier user id', required: false })
  @IsInt()
  @IsOptional()
  obj_modified_by?: number

  @ApiProperty({ example: 12, description: 'Published by user id', required: false })
  @IsInt()
  @IsOptional()
  obj_published_by?: number

  @ApiProperty({ example: true, description: 'If true, also publish to articles' , required: false })
  @IsBoolean()
  @IsOptional()
  publish?: boolean
}
