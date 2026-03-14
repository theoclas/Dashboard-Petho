import { PartialType } from '@nestjs/mapped-types';
import { CreateMapeoEstadoDto } from './create-mapeo-estado.dto';

export class UpdateMapeoEstadoDto extends PartialType(CreateMapeoEstadoDto) {}
