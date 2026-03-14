import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarteraService } from './cartera.service';
import { CarteraController } from './cartera.controller';
import { CarteraMovimiento } from './entities/cartera-movimiento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CarteraMovimiento])],
  controllers: [CarteraController],
  providers: [CarteraService],
  exports: [CarteraService],
})
export class CarteraModule {}
