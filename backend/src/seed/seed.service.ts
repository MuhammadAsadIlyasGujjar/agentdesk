import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

/**
 * App start hote hi demo data daal deta hai (sirf tab jab DB khaali ho).
 * Isse `docker compose up` ke turant baad app "zinda" lagti hai.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly log = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const existing = await this.products.count();
    if (existing > 0) {
      this.log.log('Seed skip — ' + existing + ' products pehle se maujood hain.');
      return;
    }

    const products = await this.products.save(
      this.products.create([
        { sku: 'LAP-001', name: 'ProBook 14 Laptop', category: 'Laptops', price: 145000, stock: 12, emoji: '💻', rating: 4.6, description: '14-inch, 16GB RAM, 512GB SSD' },
        { sku: 'LAP-002', name: 'UltraLite 13 Laptop', category: 'Laptops', price: 189000, stock: 5, emoji: '💻', rating: 4.8, description: 'Bahut halka, 18 ghante battery' },
        { sku: 'MON-001', name: '27" 4K Monitor', category: 'Monitors', price: 68000, stock: 20, emoji: '🖥️', rating: 4.4, description: 'IPS panel, USB-C 90W' },
        { sku: 'MON-002', name: '34" Ultrawide Monitor', category: 'Monitors', price: 112000, stock: 3, emoji: '🖥️', rating: 4.7, description: 'Curved, 144Hz' },
        { sku: 'KEY-001', name: 'Mechanical Keyboard', category: 'Accessories', price: 12500, stock: 45, emoji: '⌨️', rating: 4.5, description: 'Hot-swap switches, RGB' },
        { sku: 'MOU-001', name: 'Wireless Mouse', category: 'Accessories', price: 6500, stock: 60, emoji: '🖱️', rating: 4.2, description: 'Silent click, 3 devices' },
        { sku: 'HED-001', name: 'Noise Cancelling Headphones', category: 'Audio', price: 42000, stock: 0, emoji: '🎧', rating: 4.9, description: 'Abhi out of stock' },
        { sku: 'WEB-001', name: '1080p Webcam', category: 'Accessories', price: 9800, stock: 25, emoji: '📷', rating: 4.0, description: 'Auto-focus, built-in mic' },
        { sku: 'CHR-001', name: 'Ergonomic Chair', category: 'Furniture', price: 78000, stock: 8, emoji: '🪑', rating: 4.3, description: 'Lumbar support, adjustable' },
        { sku: 'SSD-001', name: '2TB NVMe SSD', category: 'Storage', price: 34000, stock: 30, emoji: '💾', rating: 4.6, description: '7000 MB/s read' },
      ]),
    );

    const pick = (sku: string) => products.find((p) => p.sku === sku)!;

    const orderSpecs: Array<{ n: string; name: string; email: string; status: OrderStatus; items: Array<[string, number]> }> = [
      { n: 'ORD-1001', name: 'Ayesha Khan',  email: 'ayesha@example.com', status: 'delivered', items: [['LAP-001', 1], ['MOU-001', 1]] },
      { n: 'ORD-1002', name: 'Bilal Ahmed',  email: 'bilal@example.com',  status: 'shipped',   items: [['MON-001', 2]] },
      { n: 'ORD-1003', name: 'Sara Malik',   email: 'sara@example.com',   status: 'paid',      items: [['KEY-001', 1], ['WEB-001', 1], ['SSD-001', 1]] },
      { n: 'ORD-1004', name: 'Usman Tariq',  email: 'usman@example.com',  status: 'pending',   items: [['CHR-001', 1]] },
      { n: 'ORD-1005', name: 'Hina Raza',    email: 'hina@example.com',   status: 'cancelled', items: [['LAP-002', 1]] },
      { n: 'ORD-1006', name: 'Kashif Iqbal', email: 'kashif@example.com', status: 'delivered', items: [['MON-002', 1], ['KEY-001', 2]] },
    ];

    for (const spec of orderSpecs) {
      const items = spec.items.map(([sku, qty]) => {
        const p = pick(sku);
        const item = new OrderItem();
        item.productId = p.id;
        item.productName = p.name;
        item.unitPrice = p.price;
        item.quantity = qty;
        return item;
      });

      const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

      await this.orders.save(
        this.orders.create({
          orderNumber: spec.n,
          customerName: spec.name,
          customerEmail: spec.email,
          status: spec.status,
          total,
          items,
        }),
      );
    }

    this.log.log('Seed ho gaya: ' + products.length + ' products, ' + orderSpecs.length + ' orders.');
  }
}
