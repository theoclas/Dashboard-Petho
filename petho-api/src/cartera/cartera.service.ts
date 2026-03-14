import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarteraMovimiento } from './entities/cartera-movimiento.entity';

@Injectable()
export class CarteraService {
  constructor(
    @InjectRepository(CarteraMovimiento)
    private readonly carteraRepo: Repository<CarteraMovimiento>,
  ) {}

  async findAll(query?: {
    tipo?: string;
    orden_id?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    const qb = this.carteraRepo.createQueryBuilder('c');

    if (query?.tipo) {
      qb.andWhere('c.tipo = :tipo', { tipo: query.tipo });
    }
    if (query?.orden_id) {
      qb.andWhere('c.orden_id = :orden_id', { orden_id: query.orden_id });
    }

    qb.orderBy('c.fecha', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<CarteraMovimiento> {
    const mov = await this.carteraRepo.findOneBy({ id });
    if (!mov)
      throw new NotFoundException(
        `Movimiento de cartera con ID ${id} no encontrado`,
      );
    return mov;
  }

  async getCarteraPorPedido(ordenId: string) {
    const result = await this.carteraRepo
      .createQueryBuilder('c')
      .select('c.orden_id', 'orden_id')
      .addSelect('SUM(CASE WHEN c.tipo = \'ENTRADA\' THEN c.monto ELSE -c.monto END)', 'cartera_neto')
      .where('c.orden_id = :ordenId', { ordenId })
      .groupBy('c.orden_id')
      .getRawOne();

    return result || { orden_id: ordenId, cartera_neto: 0 };
  }

  async upsert(data: Partial<CarteraMovimiento>): Promise<CarteraMovimiento> {
    const existing = await this.carteraRepo.findOneBy({
      id: data.id as number,
    });
    if (existing) {
      Object.assign(existing, data);
      return this.carteraRepo.save(existing);
    }
    const mov = this.carteraRepo.create(data);
    return this.carteraRepo.save(mov);
  }

  async bulkUpsert(records: Partial<CarteraMovimiento>[]): Promise<number> {
    let count = 0;
    for (const record of records) {
      await this.upsert(record);
      count++;
    }
    return count;
  }
}
