import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidosService } from './pedidos.service';
import { PedidosController } from './pedidos.controller';
import { Pedido } from './entities/pedido.entity';
import { ProductosDetalleModule } from '../productos-detalle/productos-detalle.module';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido]), ProductosDetalleModule],
  controllers: [PedidosController],
  providers: [PedidosService],
  exports: [PedidosService],
})
export class PedidosModule {}
