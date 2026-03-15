import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('import')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERADOR)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('pedidos')
  @UseInterceptors(FileInterceptor('file'))
  async importPedidos(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Se requiere un archivo Excel (.xlsx)');
    }
    return this.importService.importPedidos(file.buffer);
  }

  @Post('productos')
  @UseInterceptors(FileInterceptor('file'))
  async importProductos(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Se requiere un archivo Excel (.xlsx)');
    }
    return this.importService.importProductos(file.buffer);
  }

  @Post('cartera')
  @UseInterceptors(FileInterceptor('file'))
  async importCartera(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Se requiere un archivo Excel (.xlsx)');
    }
    return this.importService.importCartera(file.buffer);
  }

  @Post('cpa')
  @UseInterceptors(FileInterceptor('file'))
  async importCpa(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Se requiere un archivo Excel (.xlsx)');
    }
    return this.importService.importCpa(file.buffer);
  }

  @Post('remapear-estados')
  async remapearEstados() {
    return this.importService.remapearPedidos();
  }
}
