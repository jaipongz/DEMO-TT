import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
  Param,
  Res,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../../modules/wcm-auth/guards/jwt-auth.guard';
import type { Response } from 'express';

@Controller()
// @UseGuards(JwtAuthGuard) // TODO: Re-enable after fixing token interceptor
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get('stock/:module/:gen/:fileName')
  async getStockFile(
    @Param('module') module: string,
    @Param('gen') gen: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    const filePath = await this.uploadsService.resolveFilePath(module, gen, fileName);
    if (!filePath) {
      throw new NotFoundException('File not found');
    }

    return res.sendFile(filePath);
  }

  @Post('uploads')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
      fileFilter: (req, file, cb) => {
        console.log('[UPLOAD] File filter - file:', file.originalname, 'mime:', file.mimetype)
        // Allow all files: images, videos, documents, etc.
        console.log('[UPLOAD] File accepted')
        cb(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: any,
    @Body('module') module: string,
  ) {
    console.log('[UPLOAD] Request received - file:', file?.originalname, 'module:', module)
    
    if (!file) {
      console.log('[UPLOAD] Error: No file provided')
      throw new BadRequestException('No file provided');
    }

    if (!module) {
      console.log('[UPLOAD] Error: No module provided')
      throw new BadRequestException('Module name is required');
    }

    try {
      console.log('[UPLOAD] Saving file...')
      const result = await this.uploadsService.saveFile(file, module);
      console.log('[UPLOAD] File saved successfully:', result)
      return {
        success: true,
        message: 'File uploaded successfully',
        ...result,
      };
    } catch (error: any) {
      console.log('[UPLOAD] Error saving file:', error.message)
      throw new BadRequestException(error.message || 'Upload failed');
    }
  }
}
