import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { PedidosModule } from './pedidos/pedidos.module';
import { CarteraModule } from './cartera/cartera.module';
import { MapeoEstadosModule } from './mapeo-estados/mapeo-estados.module';
import { NotasModule } from './notas/notas.module';
import { ProductosDetalleModule } from './productos-detalle/productos-detalle.module';
import { ImportModule } from './import/import.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CpaModule } from './cpa/cpa.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    PedidosModule,
    CarteraModule,
    MapeoEstadosModule,
    NotasModule,
    ProductosDetalleModule,
    ImportModule,
    UsersModule,
    AuthModule,
    CpaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
