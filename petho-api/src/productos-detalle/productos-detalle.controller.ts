import { Controller, Get, Query, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ProductosDetalleService } from './productos-detalle.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';

@Controller('productos-detalle')
@UseGuards(FirebaseAuthGuard)
export class ProductosDetalleController {
  constructor(
    private readonly productosDetalleService: ProductosDetalleService,
  ) {}

  @Get()
  findAll(@Query('pedido_id_dropi') pedidoIdDropi?: string) {
    return this.productosDetalleService.findAll(pedidoIdDropi);
  }

  @Get('unique/names')
  findUniqueProducts() {
    return this.productosDetalleService.findUniqueProducts();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productosDetalleService.findOne(id);
  }
}
