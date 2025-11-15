import {
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { FacesService } from './faces.service';
import { MAX_IMAGE_BYTES } from './constants';

@Controller('faces')
export class FacesController {
  constructor(private readonly facesService: FacesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
    }),
  )
  async registerFace(@UploadedFile() file?: Express.Multer.File) {
    const imageBuffer = this.getValidImageBuffer(file);
    return this.facesService.registerFace(imageBuffer);
  }

  @Post('identify')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
    }),
  )
  async identifyFace(@UploadedFile() file?: Express.Multer.File) {
    const imageBuffer = this.getValidImageBuffer(file);
    return this.facesService.identifyFace(imageBuffer);
  }

  @Delete(':faceId')
  async deleteFace(@Param('faceId') faceId: string) {
    return this.facesService.deleteFace(faceId);
  }

  private getValidImageBuffer(file?: Express.Multer.File): Buffer {
    if (!file || !file.buffer?.length) {
      throw new BadRequestException('Image file is required');
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are supported');
    }

    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Image exceeds the 5 MB size limit');
    }

    return file.buffer;
  }
}
