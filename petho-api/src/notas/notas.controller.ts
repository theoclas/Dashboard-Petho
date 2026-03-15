import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { NotasService } from './notas.service';
import { NotaManual } from './entities/nota-manual.entity';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('notas')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class NotasController {
  constructor(private readonly notasService: NotasService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  create(@Body() data: Partial<NotaManual>) {
    return this.notasService.create(data);
  }

  @Get()
  findAll(@Query('id_dropi') idDropi?: string) {
    return this.notasService.findAll(idDropi);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.notasService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<NotaManual>,
  ) {
    return this.notasService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.notasService.remove(id);
  }
}
