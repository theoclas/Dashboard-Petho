import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosDetalleService } from './productos-detalle.service';
import { ProductosDetalleController } from './productos-detalle.controller';
import { ProductoDetalle } from './entities/producto-detalle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductoDetalle])],
  controllers: [ProductosDetalleController],
  providers: [ProductosDetalleService],
  exports: [ProductosDetalleService],
})
export class ProductosDetalleModule {}
