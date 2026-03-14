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
} from '@nestjs/common';
import { NotasService } from './notas.service';
import { NotaManual } from './entities/nota-manual.entity';

@Controller('notas')
export class NotasController {
  constructor(private readonly notasService: NotasService) {}

  @Post()
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
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<NotaManual>,
  ) {
    return this.notasService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.notasService.remove(id);
  }
}
