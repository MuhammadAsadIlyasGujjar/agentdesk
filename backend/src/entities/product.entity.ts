import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { numericTransformer } from './numeric.transformer';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sku: string;

  @Column()
  name: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column()
  category: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numericTransformer })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ default: '📦' })
  emoji: string;

  @Column({ type: 'numeric', precision: 3, scale: 1, default: 4.0, transformer: numericTransformer })
  rating: number;

  @CreateDateColumn()
  createdAt: Date;
}
