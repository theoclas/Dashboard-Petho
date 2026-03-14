import { IsOptional, IsString } from 'class-validator';

export class CreateMapeoEstadoDto {
  @IsOptional()
  @IsString()
  transportadora?: string;

  @IsString()
  estatus_original: string;

  @IsOptional()
  @IsString()
  ultimo_movimiento?: string;

  @IsString()
  estado_unificado: string;
}
