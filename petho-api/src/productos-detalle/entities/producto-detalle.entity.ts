import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('productos_detalle')
export class ProductoDetalle {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  pedido_id_dropi: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  producto_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  variacion_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  producto_nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  variacion: string;

  @Column({ type: 'integer', nullable: true })
  cantidad: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  precio_proveedor: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  precio_proveedor_x_cantidad: number;
}
