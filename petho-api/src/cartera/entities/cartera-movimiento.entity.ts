import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('cartera_movimientos')
export class CarteraMovimiento {
  @PrimaryColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'timestamp', nullable: true })
  fecha: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tipo: string; // ENTRADA / SALIDA

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  monto: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  monto_previo: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  orden_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  numero_guia: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  concepto_retiro: string;
}
