import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';
import { numericTransformer } from './numeric.transformer';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @Column()
  productId: string;

  /** Snapshot: product ka naam/price yahin copy kar lete hain.
   *  Kyun? Kal product ka price badal jaye to purana invoice galat nahi hona chahiye. */
  @Column()
  productName: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numericTransformer })
  unitPrice: number;

  @Column({ type: 'int' })
  quantity: number;
}
