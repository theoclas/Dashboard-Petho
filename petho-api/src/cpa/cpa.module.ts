import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CpaService } from './cpa.service';
import { CpaController } from './cpa.controller';
import { Cpa } from './entities/cpa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cpa])],
  controllers: [CpaController],
  providers: [CpaService],
  exports: [CpaService],
})
export class CpaModule {}
