import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('cpas')
export class Cpa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  semana: string;

  @Column({ type: 'timestamp', nullable: true })
  fecha: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  producto: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cuenta_publicitaria: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  gasto_publicidad: number;

  @Column({ type: 'integer', nullable: true })
  conversaciones: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  total_facturado: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  ganancia_promedio: number;

  @Column({ type: 'integer', nullable: true })
  ventas: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  ticket_promedio_producto: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cpa: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  conversion_rate: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  costo_publicitario: number;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  rentabilidad: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  utilidad_aproximada: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
