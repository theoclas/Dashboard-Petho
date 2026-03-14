import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapeoEstadosService } from './mapeo-estados.service';
import { MapeoEstadosController } from './mapeo-estados.controller';
import { MapeoEstado } from './entities/mapeo-estado.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MapeoEstado])],
  controllers: [MapeoEstadosController],
  providers: [MapeoEstadosService],
  exports: [MapeoEstadosService],
})
export class MapeoEstadosModule {}
