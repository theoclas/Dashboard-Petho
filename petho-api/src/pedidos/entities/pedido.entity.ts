import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 50, nullable: true })
  id_dropi: string;

  @Column({ type: 'timestamp', nullable: true })
  fecha: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cliente: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transportadora: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  estado_operativo: string;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  guia: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  departamento: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ciudad: string;

  @Column({ type: 'text', nullable: true })
  direccion: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  producto: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  ganancia_calc: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  costo_devolucion_estimado: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cartera: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cartera_aplicada: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  venta: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  flete: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  costo_proveedor: number;

  @Column({ type: 'timestamp', nullable: true })
  fecha_ult_mov: Date;

  @Column({ type: 'integer', nullable: true })
  dias_desde_ult_mov: number;

  @Column({ type: 'decimal', precision: 10, scale: 10, nullable: true })
  hora_ult_mov: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ultimo_mov: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  estatus_original: string;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  estado_unificado: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  estado_cartera: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  estado_app: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  estado_guia_app: string;

  @Column({ type: 'text', nullable: true })
  notas_manuales: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
