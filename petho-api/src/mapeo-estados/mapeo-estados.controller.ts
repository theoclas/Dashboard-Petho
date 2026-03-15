import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { MapeoEstadosService } from './mapeo-estados.service';
import { CreateMapeoEstadoDto } from './dto/create-mapeo-estado.dto';
import { UpdateMapeoEstadoDto } from './dto/update-mapeo-estado.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('mapeo-estados')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // Todo el controlador solo para ADMIN
export class MapeoEstadosController {
  constructor(private readonly mapeoEstadosService: MapeoEstadosService) {}

  @Post()
  create(@Body() dto: CreateMapeoEstadoDto) {
    return this.mapeoEstadosService.create(dto);
  }

  @Get()
  findAll() {
    return this.mapeoEstadosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mapeoEstadosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMapeoEstadoDto,
  ) {
    return this.mapeoEstadosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mapeoEstadosService.remove(id);
  }
}
