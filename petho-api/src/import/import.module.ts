import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { PedidosModule } from '../pedidos/pedidos.module';
import { CarteraModule } from '../cartera/cartera.module';
import { MapeoEstadosModule } from '../mapeo-estados/mapeo-estados.module';
import { NotasModule } from '../notas/notas.module';
import { ProductosDetalleModule } from '../productos-detalle/productos-detalle.module';
import { CpaModule } from '../cpa/cpa.module';

@Module({
  imports: [
    PedidosModule,
    CarteraModule,
    MapeoEstadosModule,
    NotasModule,
    ProductosDetalleModule,
    CpaModule,
  ],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
