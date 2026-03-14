import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreateCpaDto {
  @IsOptional()
  @IsString()
  semana?: string;

  @IsOptional()
  fecha?: Date | string;

  @IsOptional()
  @IsString()
  producto?: string;

  @IsOptional()
  @IsString()
  cuenta_publicitaria?: string;

  @IsOptional()
  @IsNumber()
  gasto_publicidad?: number;

  @IsOptional()
  @IsNumber()
  conversaciones?: number;

  @IsOptional()
  @IsNumber()
  total_facturado?: number;

  @IsOptional()
  @IsNumber()
  ganancia_promedio?: number;

  @IsOptional()
  @IsNumber()
  ventas?: number;

  @IsOptional()
  @IsNumber()
  ticket_promedio_producto?: number;

  @IsOptional()
  @IsNumber()
  cpa?: number;

  @IsOptional()
  @IsNumber()
  conversion_rate?: number;

  @IsOptional()
  @IsNumber()
  costo_publicitario?: number;

  @IsOptional()
  @IsNumber()
  rentabilidad?: number;

  @IsOptional()
  @IsNumber()
  utilidad_aproximada?: number;
}
