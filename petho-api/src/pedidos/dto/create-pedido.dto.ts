import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreatePedidoDto {
  @IsOptional()
  @IsString()
  id_dropi?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  cliente?: string;

  @IsOptional()
  @IsString()
  transportadora?: string;

  @IsOptional()
  @IsString()
  estado_operativo?: string;

  @IsOptional()
  @IsString()
  guia?: string;

  @IsOptional()
  @IsString()
  departamento?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsString()
  producto?: string;

  @IsOptional()
  @IsNumber()
  ganancia_calc?: number;

  @IsOptional()
  @IsNumber()
  costo_devolucion_estimado?: number;

  @IsOptional()
  @IsNumber()
  cartera?: number;

  @IsOptional()
  @IsNumber()
  cartera_aplicada?: number;

  @IsOptional()
  @IsNumber()
  venta?: number;

  @IsOptional()
  @IsNumber()
  flete?: number;

  @IsOptional()
  @IsNumber()
  costo_proveedor?: number;

  @IsOptional()
  @IsDateString()
  fecha_ult_mov?: string;

  @IsOptional()
  @IsNumber()
  dias_desde_ult_mov?: number;

  @IsOptional()
  @IsNumber()
  hora_ult_mov?: number;

  @IsOptional()
  @IsString()
  ultimo_mov?: string;

  @IsOptional()
  @IsString()
  estatus_original?: string;

  @IsOptional()
  @IsString()
  estado_unificado?: string;

  @IsOptional()
  @IsString()
  estado_cartera?: string;

  @IsOptional()
  @IsString()
  estado_app?: string;

  @IsOptional()
  @IsString()
  estado_guia_app?: string;

  @IsOptional()
  @IsString()
  notas_manuales?: string;
}
