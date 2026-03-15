import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CarteraService } from './cartera.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';

@Controller('cartera')
@UseGuards(FirebaseAuthGuard)
export class CarteraController {
  constructor(private readonly carteraService: CarteraService) {}

  @Get()
  findAll(
    @Query('tipo') tipo?: string,
    @Query('orden_id') ordenId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.carteraService.findAll({
      tipo,
      orden_id: ordenId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('por-pedido/:ordenId')
  getCarteraPorPedido(@Param('ordenId') ordenId: string) {
    return this.carteraService.getCarteraPorPedido(ordenId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.carteraService.findOne(id);
  }
}
