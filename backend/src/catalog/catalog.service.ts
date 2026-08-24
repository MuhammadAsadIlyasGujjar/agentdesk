import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';

/**
 * Normal REST layer — ismein AI ka koi taluq nahi.
 * Ye Angular ke Shop/Orders pages ke liye hai.
 *
 * 💡 Dhyan dein: agent ke tools alag service (ServerToolsService) mein hain.
 * Aisa kyun? Kyunki tool ka output "model ke liye" shape hota hai
 * (chhota, saaf), jabke REST ka output "UI ke liye". Dono mila dene se
 * dono jagah compromise karna padta hai.
 */
@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
  ) {}

  findProducts(q?: string) {
    return this.products.find({
      where: q ? { name: ILike('%' + q + '%') } : undefined,
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findProduct(id: string) {
    const product = await this.products.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product nahi mila');
    return product;
  }

  findOrders() {
    return this.orders.find({ order: { createdAt: 'DESC' }, take: 50 });
  }

  async findOrder(orderNumber: string) {
    const order = await this.orders.findOne({ where: { orderNumber: orderNumber.toUpperCase() } });
    if (!order) throw new NotFoundException('Order nahi mila');
    return order;
  }
}
