import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UnsupportedMediaTypeException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { join } from 'path';
import { CatalogWriteGuard } from '../../common/catalog-write.guard';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';

const productImageDirectory = join(process.cwd(), 'uploads', 'products');
const imageExtensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

mkdirSync(productImageDirectory, { recursive: true });

@Controller('upload/product-image')
@UseGuards(JwtAuthGuard, CatalogWriteGuard)
export class ProductImageUploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: productImageDirectory,
        filename: (_request, file, callback) => {
          callback(null, `${randomUUID()}${imageExtensions[file.mimetype] || ''}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
      fileFilter: (_request, file, callback) => {
        if (!imageExtensions[file.mimetype]) {
          callback(
            new UnsupportedMediaTypeException('Only JPG, PNG, WEBP and GIF images are allowed'),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Product image file is required');

    return {
      url: `/uploads/products/${file.filename}`,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
