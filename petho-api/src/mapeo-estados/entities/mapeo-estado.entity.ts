import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('mapeo_estados')
@Index(['transportadora', 'estatus_original', 'ultimo_movimiento'], {
  unique: true,
})
export class MapeoEstado {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transportadora: string;

  @Column({ type: 'varchar', length: 100 })
  estatus_original: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ultimo_movimiento: string;

  @Column({ type: 'varchar', length: 100 })
  estado_unificado: string;
}
