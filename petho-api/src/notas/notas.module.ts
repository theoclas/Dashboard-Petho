import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotasService } from './notas.service';
import { NotasController } from './notas.controller';
import { NotaManual } from './entities/nota-manual.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NotaManual])],
  controllers: [NotasController],
  providers: [NotasService],
  exports: [NotasService],
})
export class NotasModule {}
