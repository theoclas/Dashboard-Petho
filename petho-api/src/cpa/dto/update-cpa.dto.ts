import { PartialType } from '@nestjs/mapped-types';
import { CreateCpaDto } from './create-cpa.dto';

export class UpdateCpaDto extends PartialType(CreateCpaDto) {}
