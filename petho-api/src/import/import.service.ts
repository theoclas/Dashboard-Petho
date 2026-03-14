import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PedidosService } from '../pedidos/pedidos.service';
import { CarteraService } from '../cartera/cartera.service';
import { MapeoEstadosService } from '../mapeo-estados/mapeo-estados.service';
import { NotasService } from '../notas/notas.service';
import { ProductosDetalleService } from '../productos-detalle/productos-detalle.service';
import { CpaService } from '../cpa/cpa.service';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private readonly pedidosService: PedidosService,
    private readonly carteraService: CarteraService,
    private readonly mapeoEstadosService: MapeoEstadosService,
    private readonly notasService: NotasService,
    private readonly productosDetalleService: ProductosDetalleService,
    private readonly cpaService: CpaService,
  ) {}

  private async getResolverEnMemoria() {
    const todosMapeos = await this.mapeoEstadosService.findAll();
    const normStr = (s?: string | null) => {
      if (!s) return '';
      let text = s.toLowerCase().trim();
      text = text.replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
                 .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ü/g, 'u');
      return text;
    };

    const mapeosNormalizados = todosMapeos.map((m) => ({
      t: normStr(m.transportadora),
      e: normStr(m.estatus_original),
      m: normStr(m.ultimo_movimiento),
      estadoUnificado: m.estado_unificado,
    }));

    return (transportadora?: string, pedidoKey?: string, ultimoMov?: string) => {
      const t = normStr(transportadora);
      const e = normStr(pedidoKey);
      const m = normStr(ultimoMov);

      let match = mapeosNormalizados.find((x) => x.t === t && x.e === e && x.m === m);
      if (match) return match.estadoUnificado;

      match = mapeosNormalizados.find((x) => x.t === t && x.e === e && x.m === '');
      if (match) return match.estadoUnificado;

      match = mapeosNormalizados.find((x) => x.e === e);
      if (match) return match.estadoUnificado;

      return null;
    };
  }

  /**
   * Importa el archivo de PEDIDOS exportado desde Dropi.
   * Replica la lógica de Power Query:
   * 1. Lee Sheet1 del Excel
   * 2. Promueve encabezados (Table.PromoteHeaders)
   * 3. Mapea columnas del Excel a la entidad Pedido
   * 4. Aplica mapeo de estados si la tabla mapeo_estados tiene datos
   * 5. Upsert por id_dropi
   */
  async importPedidos(
    buffer: Buffer,
  ): Promise<{ imported: number; errors: string[] }> {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames.find((s) => s === 'Sheet1') || wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];

    if (!ws) throw new BadRequestException('No se encontró la hoja Sheet1');

    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
      defval: null,
    });

    this.logger.log(`Procesando ${rows.length} filas de pedidos...`);

    const errors: string[] = [];
    let imported = 0;

    // ══ Cargar mapa de estados EN MEMORIA para evitar N+1 Consultas y arreglar normalización ══
    const resolveEstadoEnMemoria = await this.getResolverEnMemoria();


    for (const row of rows) {
      try {
        const idDropi = this.toString(row['ID']);
        if (!idDropi) continue;

        const transportadora = this.toString(row['TRANSPORTADORA']);
        const venta = this.toNumber(row['VALOR DE COMPRA EN PRODUCTOS']) 
          || this.toNumber(row['VALOR FACTURADO']) 
          || this.toNumber(row['TOTAL DE LA ORDEN'])
          || 0;
        const flete = this.toNumber(row['PRECIO FLETE']) || 0;
        const costoProveedor = this.toNumber(row['TOTAL EN PRECIOS DE PROVEEDOR']) || 0;
        const estatusOriginal = this.toString(row['ESTATUS']) || '';
        const ultimoMov = this.toString(row['ÚLTIMO MOVIMIENTO']);
        const fechaUltMov = this.parseDate(row['FECHA DE ÚLTIMO MOVIMIENTO']);

        // ═══ Paso 19: ganancia_calc = venta - flete - costo_proveedor ═══
        const gananciaCalc = venta - flete - costoProveedor;

        // ═══ Paso 20-29: costo_devolucion_estimado ═══
        // Si es INTERRAPIDISIMO → -flete, sino → -flete * 0.8
        const esInterrapidisimo = transportadora
          ? transportadora.toUpperCase().includes('INTERRAPIDISIMO')
          : false;
        const costoDevolucionEstimado = esInterrapidisimo
          ? -(flete)
          : -(flete * 0.8);

        // ═══ Paso 58-60: dias_desde_ult_mov ═══
        let diasDesdeUltMov: number | undefined;
        if (fechaUltMov) {
          const now = new Date();
          diasDesdeUltMov = Math.floor(
            (now.getTime() - fechaUltMov.getTime()) / (1000 * 60 * 60 * 24),
          );
        }

        // ═══ Pasos 31-52: Pedido_key (normalización para mapeo) ═══
        // Normalizar: lowercase, trim, quitar acentos
        const normalizeKey = (text: string): string => {
          let s = text.toLowerCase().trim();
          s = s.replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
               .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ü/g, 'u');
          return s;
        };

        const estNorm = normalizeKey(estatusOriginal);
        const movNorm = ultimoMov ? normalizeKey(ultimoMov) : '';

        // PRIORIDAD: el estado real (estatus_original) a menos que sea "guia_generada"/"guia generada"
        let pedidoKey: string | undefined;
        if (estNorm !== '' && estNorm !== 'guia_generada' && estNorm !== 'guia generada') {
          pedidoKey = estatusOriginal; // Pasar literal, resolver se encarga de normalizar
        } else if (movNorm !== '') {
          pedidoKey = ultimoMov; 
        } else {
          pedidoKey = estatusOriginal;
        }

        // ═══ Pasos 53-57: MapeoEstados en memoria → estado_unificado ═══
        let estadoUnificado = resolveEstadoEnMemoria(
          transportadora,
          pedidoKey,
          ultimoMov,
        );
        if (!estadoUnificado || estadoUnificado.trim() === '') {
          estadoUnificado = 'SIN MAPEAR';
        }

        // ═══ Pasos 61-63: estado_operativo ═══
        // Si estado_unificado es "OFICINA" y dias_desde_ult_mov > 1 → "OFICINA 1"
        let estadoOperativo = estadoUnificado;
        if (estadoUnificado === 'OFICINA' && diasDesdeUltMov !== undefined && diasDesdeUltMov > 1) {
          estadoOperativo = 'OFICINA 1';
        }

        // ═══ Pasos 76-88: Cartera JOIN → cartera_aplicada y estado_cartera ═══
        const carteraResult = await this.carteraService.getCarteraPorPedido(idDropi);
        const carteraNeto = Number(carteraResult?.cartera_neto) || 0;

        const estadosConCartera = ['ENTREGADO', 'DEVOLUCION', 'DEVOLUCIÓN'];
        const carteraAplicada = estadosConCartera.includes(estadoUnificado.toUpperCase())
          ? carteraNeto
          : 0;

        const estadoCartera =
          carteraNeto !== 0 && estadosConCartera.includes(estadoUnificado.toUpperCase())
            ? 'OK'
            : '';

        // ═══ Columna "cartera" (fórmula Excel) ═══
        // =SI.ERROR(SI.CONJUNTO(estado_operativo="ENTREGADO",ganancia_calc, estado_operativo="DEVOLUCION",costo_devolucion_estimado),0)
        let cartera = 0;
        if (estadoOperativo === 'ENTREGADO') {
          cartera = gananciaCalc;
        } else if (estadoOperativo === 'DEVOLUCION' || estadoOperativo === 'DEVOLUCIÓN') {
          cartera = costoDevolucionEstimado;
        }

        // Construir el pedido final
        const pedidoData = {
          id_dropi: idDropi,
          fecha: this.parseDate(row['FECHA']),
          cliente: this.toString(row['NOMBRE CLIENTE']),
          transportadora,
          estado_operativo: estadoOperativo,
          guia: this.toString(row['NÚMERO GUIA']),
          departamento: this.toString(row['DEPARTAMENTO DESTINO']),
          ciudad: this.toString(row['CIUDAD DESTINO']),
          direccion: this.toString(row['DIRECCION']),
          telefono: this.toString(row['TELÉFONO']),
          notas: this.toString(row['NOTAS']),
          venta,
          ganancia_calc: gananciaCalc,
          flete,
          costo_devolucion_estimado: costoDevolucionEstimado,
          costo_proveedor: costoProveedor,
          estatus_original: estatusOriginal,
          ultimo_mov: ultimoMov,
          fecha_ult_mov: fechaUltMov,
          hora_ult_mov: this.parseTime(row['HORA DE ÚLTIMO MOVIMIENTO']),
          dias_desde_ult_mov: diasDesdeUltMov,
          estado_unificado: estadoUnificado,
          cartera,
          cartera_aplicada: carteraAplicada,
          estado_cartera: estadoCartera,
        };

        await this.pedidosService.upsertByDropiId(pedidoData);
        imported++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Fila con ID ${row['ID']}: ${msg}`);
      }
    }

    this.logger.log(`Pedidos importados: ${imported}. Errores: ${errors.length}`);
    return { imported, errors };
  }

  /**
   * Importa el archivo de PRODUCTOS exportado desde Dropi.
   * Replica la lógica de Power Query "Transformar archivo de Productos"
   * Si un pedido ya tiene productos, los reemplaza (evita duplicados).
   */
  async importProductos(
    buffer: Buffer,
  ): Promise<{ imported: number; errors: string[] }> {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames.find((s) => s === 'Sheet1') || wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];

    if (!ws) throw new BadRequestException('No se encontró la hoja Sheet1');

    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
      defval: null,
    });

    this.logger.log(`Procesando ${rows.length} filas de productos...`);

    const errors: string[] = [];
    let imported = 0;

    // Agrupar productos por pedido para hacer delete+insert por pedido
    const productosPorPedido = new Map<string, Partial<import('../productos-detalle/entities/producto-detalle.entity').ProductoDetalle>[]>();

    for (const row of rows) {
      const pedidoIdDropi = this.toString(row['ID']);
      if (!pedidoIdDropi) continue;

      const productoData = {
        pedido_id_dropi: pedidoIdDropi,
        producto_id: this.toString(row['PRODUCTO ID']),
        sku: this.toString(row['SKU']),
        variacion_id: this.toString(row['VARIACION ID']),
        producto_nombre: this.toString(row['PRODUCTO']),
        variacion: this.toString(row['VARIACION']),
        cantidad: this.toNumber(row['CANTIDAD']) || 0,
        precio_proveedor: this.toNumber(row['PRECIO PROVEEDOR']),
        precio_proveedor_x_cantidad: this.toNumber(
          row['PRECIO PROVEEDOR X CANTIDAD'],
        ),
      };

      if (!productosPorPedido.has(pedidoIdDropi)) {
        productosPorPedido.set(pedidoIdDropi, []);
      }
      productosPorPedido.get(pedidoIdDropi)!.push(productoData);
    }

    // Para cada pedido: borrar productos existentes y reinsertar
    for (const [pedidoId, productos] of productosPorPedido) {
      try {
        await this.productosDetalleService.deleteByPedidoDropiId(pedidoId);
        await this.productosDetalleService.bulkInsert(productos);
        imported += productos.length;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Pedido ${pedidoId}: ${msg}`);
      }
    }

    this.logger.log(
      `Productos importados: ${imported}. Errores: ${errors.length}`,
    );
    return { imported, errors };
  }

  /**
   * Importa el archivo de CARTERA exportado desde Dropi.
   * Replica la lógica de Power Query "Transformar archivo de Cartera_Raw"
   * Lee la hoja "HISTORIAL DE CARTERA"
   */
  async importCartera(
    buffer: Buffer,
  ): Promise<{ imported: number; errors: string[] }> {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName =
      wb.SheetNames.find((s) => s === 'HISTORIAL DE CARTERA') ||
      wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];

    if (!ws)
      throw new BadRequestException(
        'No se encontró la hoja HISTORIAL DE CARTERA',
      );

    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
      defval: null,
    });

    this.logger.log(`Procesando ${rows.length} filas de cartera...`);

    const errors: string[] = [];
    let imported = 0;

    for (const row of rows) {
      try {
        const id = this.toNumber(row['ID']);
        if (!id) continue;

        const carteraData = {
          id,
          fecha: this.parseDateTime(row['FECHA']),
          tipo: this.toString(row['TIPO']),
          monto: this.toNumber(row['MONTO']),
          monto_previo: this.toNumber(row['MONTO PREVIO']),
          orden_id: this.toString(row['ORDEN ID']),
          numero_guia: this.toString(row['NUMERO DE GUIA']),
          descripcion: this.toString(row['DESCRIPCIÓN']),
          concepto_retiro: this.toString(row['CONCEPTO DE RETIRO']),
        };

        await this.carteraService.upsert(carteraData);
        imported++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Fila cartera ID ${row['ID']}: ${msg}`);
      }
    }

    this.logger.log(
      `Cartera importada: ${imported}. Errores: ${errors.length}`,
    );
    return { imported, errors };
  }

  /**
   * Importa el archivo de CPA.
   */
  async importCpa(
    buffer: Buffer,
  ): Promise<{ imported: number; errors: string[] }> {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName =
      wb.SheetNames.find((s) => s === 'INPUT_DATA') || wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];

    if (!ws) throw new BadRequestException('No se encontró la hoja INPUT_DATA');

    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
      defval: null,
    });

    this.logger.log(`Procesando ${rows.length} filas de CPA...`);

    const errors: string[] = [];
    let imported = 0;

    for (const row of rows) {
      try {
        const fecha = this.parseDate(row['Fecha']);
        const producto = this.toString(row['Producto']);
        
        // Si no hay fecha ni producto, probablemente es una fila vacia o de total
        if (!fecha && !producto) continue;

        const cpaData = {
          semana: this.toString(row['SEMANA']),
          fecha: fecha,
          producto: producto,
          cuenta_publicitaria: this.toString(row['Cuenta publicitaria']),
          gasto_publicidad: this.toNumber(row['GASTO PUBLICIDAD']),
          conversaciones: this.toNumber(row['CONVERSACIONES']),
          total_facturado: this.toNumber(row['TOTAL FACTURADO']),
          ganancia_promedio: this.toNumber(row['GANANCIA PROMEDIO']),
          ventas: this.toNumber(row['VENTAS']),
          ticket_promedio_producto: this.toNumber(row['TICKET PROMEDIO DE PRODUCTO   ']), // Ojo con los espacios al final si los hay
          cpa: this.toNumber(row['CPA']),
          conversion_rate: this.toNumber(row['CONVERSION RATE']),
          costo_publicitario: this.toNumber(row['COSTO PUBLICITARIO']),
          rentabilidad: this.toNumber(row['RENTABILIDAD']),
          utilidad_aproximada: this.toNumber(row['UTILIDAD APROXIMADA']),
        };

        await this.cpaService.upsert(cpaData);
        imported++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Fila CPA con Producto ${row['Producto']}: ${msg}`);
      }
    }

    this.logger.log(`CPA importado: ${imported}. Errores: ${errors.length}`);
    return { imported, errors };
  }


  async remapearPedidos(): Promise<{ procesados: number; remapeados: number }> {
    const resolveEstadoEnMemoria = await this.getResolverEnMemoria();
    const result = await this.pedidosService.findAll({ estado_unificado: 'SIN MAPEAR', limit: 3000 });
    const pedidosPendientes = result.data;

    let procesados = 0;
    let remapeados = 0;

    for (const pedido of pedidosPendientes) {
      procesados++;
      
      const normalizeKey = (text: string): string => {
        let s = text.toLowerCase().trim();
        s = s.replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
             .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ü/g, 'u');
        return s;
      };

      const estNorm = normalizeKey(pedido.estatus_original || '');
      const movNorm = pedido.ultimo_mov ? normalizeKey(pedido.ultimo_mov) : '';

      let pedidoKey: string | undefined;
      if (estNorm !== '' && estNorm !== 'guia_generada' && estNorm !== 'guia generada') {
        pedidoKey = pedido.estatus_original;
      } else if (movNorm !== '') {
        pedidoKey = pedido.ultimo_mov; 
      } else {
        pedidoKey = pedido.estatus_original;
      }

      let estadoUnificado = resolveEstadoEnMemoria(
        pedido.transportadora,
        pedidoKey,
        pedido.ultimo_mov,
      );

      // Si se logró mapear, recalcular finanzas en base a "ENTREGADO", "DEVOLUCION"
      if (estadoUnificado && estadoUnificado.trim() !== '') {
        let estadoOperativo = estadoUnificado;
        if (estadoUnificado === 'OFICINA' && pedido.dias_desde_ult_mov !== undefined && pedido.dias_desde_ult_mov > 1) {
          estadoOperativo = 'OFICINA 1';
        }

        const carteraResult = await this.carteraService.getCarteraPorPedido(pedido.id_dropi);
        const carteraNeto = Number(carteraResult?.cartera_neto) || 0;

        const estadosConCartera = ['ENTREGADO', 'DEVOLUCION', 'DEVOLUCIÓN'];
        const carteraAplicada = estadosConCartera.includes(estadoUnificado.toUpperCase())
          ? carteraNeto
          : 0;

        const estadoCartera =
          carteraNeto !== 0 && estadosConCartera.includes(estadoUnificado.toUpperCase())
            ? 'OK'
            : '';

        let cartera = 0;
        if (estadoOperativo === 'ENTREGADO') {
          cartera = pedido.ganancia_calc || 0;
        } else if (estadoOperativo === 'DEVOLUCION' || estadoOperativo === 'DEVOLUCIÓN') {
          cartera = pedido.costo_devolucion_estimado || 0;
        }

        await this.pedidosService.upsertByDropiId({
          id_dropi: pedido.id_dropi,
          estado_unificado: estadoUnificado,
          estado_operativo: estadoOperativo,
          cartera_aplicada: carteraAplicada,
          estado_cartera: estadoCartera,
          cartera: cartera,
        });

        remapeados++;
      }
    }

    this.logger.log(`Proceso de remapeo: Evaluados ${procesados}, Actualizados ${remapeados}`);
    return { procesados, remapeados };
  }

  // ─── Utilidades de parsing ────────────────────────────────────

  private toString(value: unknown): string | undefined {
    if (value === null || value === undefined) return undefined;
    return String(value).trim() || undefined;
  }

  private toNumber(value: unknown): number | undefined {
    if (value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Parsea fechas en formato "DD-MM-YYYY" o serial de Excel
   */
  private parseDate(value: unknown): Date | undefined {
    if (value === null || value === undefined) return undefined;

    // Si es un número (serial de Excel)
    if (typeof value === 'number') {
      return this.excelSerialToDate(value);
    }

    const str = String(value).trim();
    if (!str) return undefined;

    // Formato "DD-MM-YYYY"
    const parts = str.split('-');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const date = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
      );
      if (!isNaN(date.getTime())) return date;
    }

    // Intentar parsing directo
    const date = new Date(str);
    return isNaN(date.getTime()) ? undefined : date;
  }

  /**
   * Parsea datetime en formato "DD-MM-YYYY HH:mm" o serial de Excel
   */
  private parseDateTime(value: unknown): Date | undefined {
    if (value === null || value === undefined) return undefined;

    if (typeof value === 'number') {
      return this.excelSerialToDate(value);
    }

    const str = String(value).trim();
    if (!str) return undefined;

    // Formato "DD-MM-YYYY HH:mm"
    const match = str.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/);
    if (match) {
      const [, day, month, year, hour, minute] = match;
      return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        parseInt(hour, 10),
        parseInt(minute, 10),
      );
    }

    return this.parseDate(value);
  }

  /**
   * Parsea hora en formato "HH:mm" a fracción decimal
   */
  private parseTime(value: unknown): number | undefined {
    if (value === null || value === undefined) return undefined;

    if (typeof value === 'number') return value;

    const str = String(value).trim();
    const match = str.match(/^(\d{2}):(\d{2})$/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      return (hours + minutes / 60) / 24; // Fracción del día como en Excel
    }

    return undefined;
  }

  /**
   * Convierte serial numérico de Excel a Date de JavaScript
   */
  private excelSerialToDate(serial: number): Date {
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    const fractionalDay = serial - Math.floor(serial);
    const totalSeconds = Math.floor(86400 * fractionalDay);

    const date = new Date(utcValue * 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    date.setUTCHours(hours, minutes, 0, 0);

    return date;
  }
}
