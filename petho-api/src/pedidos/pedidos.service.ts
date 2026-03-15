import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from './entities/pedido.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { ProductosDetalleService } from '../productos-detalle/productos-detalle.service';

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
    private readonly productosDetalleService: ProductosDetalleService,
  ) { }

  private calculateFinancials(pedido: Pedido) {
    const venta = Number(pedido.venta ?? 0);
    const flete = Number(pedido.flete ?? 0);
    const costo_proveedor = Number(pedido.costo_proveedor ?? 0);

    pedido.ganancia_calc = venta - flete - costo_proveedor;

    const transportadora = (pedido.transportadora || '').toUpperCase();
    const esInterrapidisimo = transportadora.includes('INTERRAPIDISIMO');
    pedido.costo_devolucion_estimado = esInterrapidisimo ? -flete : -(flete * 0.8);

    // Priorizamos estado_unificado (Estado Asignado) o estado_operativo
    const estado = (pedido.estado_unificado || pedido.estado_operativo || '').toUpperCase();

    if (estado === 'ENTREGADO') {
      pedido.cartera = pedido.ganancia_calc;
    } else if (estado === 'DEVOLUCION' || estado === 'DEVOLUCIÓN') {
      pedido.cartera = pedido.costo_devolucion_estimado;
    } else {
      pedido.cartera = 0;
    }
  }

  async create(createPedidoDto: CreatePedidoDto): Promise<Pedido> {
    const pedido = this.pedidoRepository.create(createPedidoDto);
    this.calculateFinancials(pedido);
    return this.pedidoRepository.save(pedido);
  }

  async findAll(query?: {
    estado_unificado?: string;
    transportadora?: string;
    ciudad?: string;
    id_dropi?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortField?: string;
    sortOrder?: 'ASC' | 'DESC';
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: Pedido[]; total: number; page: number; limit: number }> {
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    const qb = this.pedidoRepository.createQueryBuilder('pedido');

    if (query?.startDate && query?.endDate) {
      qb.andWhere('pedido.fecha BETWEEN :startDate AND :endDate', {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      });
    }

    if (query?.estado_unificado) {
      qb.andWhere('pedido.estado_unificado ILIKE :estado', {
        estado: `%${query.estado_unificado}%`,
      });
    }

    if (query?.transportadora) {
      qb.andWhere('pedido.transportadora ILIKE :transportadora', {
        transportadora: `%${query.transportadora}%`,
      });
    }

    if (query?.id_dropi) {
      qb.andWhere('pedido.id_dropi ILIKE :id_dropi', {
        id_dropi: `%${query.id_dropi}%`,
      });
    }

    if (query?.ciudad) {
      qb.andWhere('pedido.ciudad ILIKE :ciudad', {
        ciudad: `%${query.ciudad}%`,
      });
    }

    if (query?.startDate && query?.endDate) {
      qb.andWhere('pedido.fecha BETWEEN :startDate AND :endDate', {
        startDate: new Date(query.startDate + 'T00:00:00'),
        endDate: new Date(query.endDate + 'T23:59:59'),
      });
    } else if (query?.startDate) {
      qb.andWhere('pedido.fecha >= :startDate', {
        startDate: new Date(query.startDate + 'T00:00:00'),
      });
    } else if (query?.endDate) {
      qb.andWhere('pedido.fecha <= :endDate', {
        endDate: new Date(query.endDate + 'T23:59:59'),
      });
    }

    const sortField = query?.sortField || 'id';
    const sortOrder = query?.sortOrder || 'DESC';

    const allowedFields = ['id', 'id_dropi', 'fecha', 'ciudad', 'transportadora', 'venta', 'ganancia_calc', 'flete', 'cartera'];
    const field = allowedFields.includes(sortField) ? `pedido.${sortField}` : 'pedido.id';

    qb.orderBy(field, sortOrder);
    
    if (field !== 'pedido.id') {
      qb.addOrderBy('pedido.id', 'DESC');
    }
    
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async getDashboardStats(startDate?: string, endDate?: string) {
    const qb = this.pedidoRepository.createQueryBuilder('pedido');

    if (startDate && endDate) {
      qb.andWhere('pedido.fecha BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const dailyQb = qb.clone();

    const result = await qb
      .select('COUNT(*)::int', 'total')
      .addSelect(
        `COUNT(CASE WHEN pedido.estado_unificado = 'ENTREGADO' OR pedido.estado_operativo = 'ENTREGADO' THEN 1 END)::int`,
        'entregados',
      )
      .addSelect(
        `COUNT(CASE WHEN pedido.estado_unificado ILIKE '%DEVOLUCI%' OR pedido.estado_operativo ILIKE '%DEVOLUCI%' THEN 1 END)::int`,
        'devoluciones',
      )
      .addSelect(
        `COUNT(CASE WHEN pedido.estado_unificado = 'SIN MAPEAR' THEN 1 END)::int`,
        'sin_mapear',
      )
      .addSelect(`COALESCE(SUM(pedido.venta), 0)::numeric`, 'total_ventas')
      .addSelect(`COALESCE(SUM(pedido.ganancia_calc), 0)::numeric`, 'total_ganancia')
      .addSelect(`COALESCE(SUM(pedido.cartera), 0)::numeric`, 'total_cartera')
      .getRawOne();

    const dailyResult = await dailyQb
      .select('DATE(pedido.fecha)', 'date')
      .addSelect('COUNT(*)::int', 'total')
      .addSelect(
        `COUNT(CASE WHEN pedido.estado_unificado = 'ENTREGADO' OR pedido.estado_operativo = 'ENTREGADO' THEN 1 END)::int`,
        'entregados',
      )
      .addSelect(
        `COUNT(CASE WHEN pedido.estado_unificado ILIKE '%DEVOLUCI%' OR pedido.estado_operativo ILIKE '%DEVOLUCI%' THEN 1 END)::int`,
        'devoluciones',
      )
      .addSelect(
        `COUNT(CASE WHEN pedido.estado_unificado = 'SIN MAPEAR' THEN 1 END)::int`,
        'sin_mapear',
      )
      .addSelect(`COALESCE(SUM(pedido.venta), 0)::numeric`, 'total_ventas')
      .addSelect(`COALESCE(SUM(pedido.ganancia_calc), 0)::numeric`, 'total_ganancia')
      .addSelect(`COALESCE(SUM(pedido.cartera), 0)::numeric`, 'total_cartera')
      .groupBy('DATE(pedido.fecha)')
      .orderBy('DATE(pedido.fecha)', 'ASC')
      .getRawMany();

    const daily = dailyResult.map(row => {
      const dTotal = row.total || 0;
      const dEntregados = row.entregados || 0;
      const dDevoluciones = row.devoluciones || 0;
      const dSinMapear = row.sin_mapear || 0;
      const dEnProceso = Math.max(0, dTotal - dEntregados - dDevoluciones - dSinMapear);

      const dDateStr = row.date instanceof Date 
        ? row.date.toISOString().split('T')[0] 
        : (row.date ? String(row.date) : '');

      return {
        date: dDateStr,
        total: dTotal,
        entregados: dEntregados,
        devoluciones: dDevoluciones,
        enProceso: dEnProceso,
        sinMapear: dSinMapear,
        totalVentas: Number(row.total_ventas || 0),
        totalGanancia: Number(row.total_ganancia || 0),
        totalCartera: Number(row.total_cartera || 0),
      };
    }).filter(d => Boolean(d.date));

    const total = result.total || 0;
    const entregados = result.entregados || 0;
    const devoluciones = result.devoluciones || 0;
    const sinMapear = result.sin_mapear || 0;
    const enProceso = Math.max(0, total - entregados - devoluciones - sinMapear);

    return {
      total,
      entregados,
      devoluciones,
      enProceso,
      totalVentas: Number(result.total_ventas || 0),
      totalGanancia: Number(result.total_ganancia || 0),
      totalCartera: Number(result.total_cartera || 0),
      sinMapear,
      daily,
    };
  }

  async findOne(id: number): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOneBy({ id });
    if (!pedido) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }
    return pedido;
  }

  async findByDropiId(idDropi: string) {
    const pedido = await this.pedidoRepository.findOneBy({ id_dropi: idDropi });
    if (!pedido) {
      throw new NotFoundException(`Pedido con id_dropi ${idDropi} no encontrado`);
    }

    // Traer los productos relacionados por id_dropi
    const productos = await this.productosDetalleService.findAll(idDropi);

    return {
      ...pedido,
      productos,
    };
  }

  async update(id: number, updatePedidoDto: UpdatePedidoDto): Promise<Pedido> {
    const pedido = await this.findOne(id);
    Object.assign(pedido, updatePedidoDto);
    this.calculateFinancials(pedido);
    return this.pedidoRepository.save(pedido);
  }

  async remove(id: number): Promise<void> {
    const pedido = await this.findOne(id);
    await this.pedidoRepository.remove(pedido);
  }

  async upsertByDropiId(data: Partial<Pedido>): Promise<Pedido> {
    const existing = await this.pedidoRepository.findOneBy({
      id_dropi: data.id_dropi,
    });
    if (existing) {
      Object.assign(existing, data);
      this.calculateFinancials(existing);
      return this.pedidoRepository.save(existing);
    }
    const pedido = this.pedidoRepository.create(data);
    this.calculateFinancials(pedido);
    return this.pedidoRepository.save(pedido);
  }

  async bulkUpsert(records: Partial<Pedido>[]): Promise<number> {
    let count = 0;
    for (const record of records) {
      await this.upsertByDropiId(record);
      count++;
    }
    return count;
  }
}
