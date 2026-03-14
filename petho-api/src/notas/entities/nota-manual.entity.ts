import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('notas_manuales')
export class NotaManual {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  id_dropi: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nombre: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  producto: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  oficina: string;

  @Column({ type: 'text', nullable: true })
  nota: string;
}
