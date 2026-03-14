import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCpaDto } from './dto/create-cpa.dto';
import { UpdateCpaDto } from './dto/update-cpa.dto';
import { Cpa } from './entities/cpa.entity';

@Injectable()
export class CpaService {
  constructor(
    @InjectRepository(Cpa)
    private readonly cpaRepository: Repository<Cpa>,
  ) {}

  create(createCpaDto: CreateCpaDto) {
    const cpa = this.cpaRepository.create(createCpaDto);
    return this.cpaRepository.save(cpa);
  }

  async upsert(data: Partial<Cpa>) {
    if (!data.fecha || !data.producto || !data.cuenta_publicitaria) {
      return this.create(data as CreateCpaDto);
    }

    const existing = await this.cpaRepository.findOne({
      where: {
        fecha: data.fecha,
        producto: data.producto,
        cuenta_publicitaria: data.cuenta_publicitaria,
      },
    });

    if (existing) {
      Object.assign(existing, data);
      return this.cpaRepository.save(existing);
    }

    return this.create(data as CreateCpaDto);
  }

  findAll() {
    return this.cpaRepository.find();
  }

  async findOne(id: number) {
    const cpa = await this.cpaRepository.findOne({ where: { id } });
    if (!cpa) {
      throw new NotFoundException(`CPA with ID ${id} not found`);
    }
    return cpa;
  }

  async update(id: number, updateCpaDto: UpdateCpaDto) {
    const cpa = await this.findOne(id);
    Object.assign(cpa, updateCpaDto);
    return this.cpaRepository.save(cpa);
  }

  async remove(id: number) {
    const cpa = await this.findOne(id);
    return this.cpaRepository.remove(cpa);
  }

  async getDashboardStats(startDate?: string, endDate?: string) {
    const qb = this.cpaRepository.createQueryBuilder('cpa');

    if (startDate && endDate) {
      qb.andWhere('cpa.fecha BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const dailyQb = qb.clone();

    const result = await qb
      .select('SUM(cpa.cpa)', 'total_cpa')
      .addSelect('SUM(cpa.gasto_publicidad)', 'total_gasto_publicidad')
      .addSelect('SUM(cpa.utilidad_aproximada)', 'total_utilidad')
      .addSelect('SUM(cpa.ventas)', 'total_ventas')
      .addSelect('SUM(cpa.conversaciones)', 'total_conversaciones')
      .getRawOne();

    const dailyResult = await dailyQb
      .select('DATE(cpa.fecha)', 'date')
      .addSelect('SUM(cpa.cpa)', 'total_cpa')
      .addSelect('SUM(cpa.gasto_publicidad)', 'total_gasto_publicidad')
      .addSelect('SUM(cpa.utilidad_aproximada)', 'total_utilidad')
      .addSelect('SUM(cpa.ventas)', 'total_ventas')
      .addSelect('SUM(cpa.conversaciones)', 'total_conversaciones')
      .groupBy('DATE(cpa.fecha)')
      .orderBy('DATE(cpa.fecha)', 'ASC')
      .getRawMany();

    const daily = dailyResult.map(row => {
      const dDateStr = row.date instanceof Date 
        ? row.date.toISOString().split('T')[0] 
        : (row.date ? String(row.date) : '');
      
      return {
        date: dDateStr,
        cpa: Number(row.total_cpa || 0),
        gasto_publicidad: Number(row.total_gasto_publicidad || 0),
        utilidad_aproximada: Number(row.total_utilidad || 0),
        ventas: Number(row.total_ventas || 0),
        conversaciones: Number(row.total_conversaciones || 0),
      };
    }).filter(d => Boolean(d.date));

    // Notice we report 'cpa' as metric, so the chart works easily
    return {
      totalCpa: Number(result.total_cpa || 0),
      totalGasto: Number(result.total_gasto_publicidad || 0),
      totalUtilidadCpa: Number(result.total_utilidad || 0),
      totalVentasCpa: Number(result.total_ventas || 0),
      totalConversacionesCpa: Number(result.total_conversaciones || 0),
      dailyCpa: daily,
    };
  }
}
