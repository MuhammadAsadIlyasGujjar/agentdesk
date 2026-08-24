import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { Order } from '../../entities/order.entity';
import { ToolDefinition } from '../agent.types';

/**
 * ============================================================
 *  MODULE 1 / DAY 2 — SERVER-SIDE TOOLS
 * ============================================================
 * Do bilkul alag cheezein yahan hain:
 *
 *   1) DEFINITIONS  -> model ko sirf ye "shape" dikhti hai (neeche `definitions`)
 *   2) EXECUTION    -> asli code, asli PostgreSQL query (neeche `execute`)
 *
 * Model kabhi DB ko touch nahi karta. Wo sirf keh sakta hai
 * "search_products chalao" — chalata HUM hain.
 */
@Injectable()
export class ServerToolsService {
  private readonly log = new Logger(ServerToolsService.name);

  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
  ) {}

  /* ================================================================
   *  1. DEFINITIONS — model ke liye "menu card"
   * ================================================================ */
  readonly definitions: ToolDefinition[] = [
    {
      name: 'search_products',
      // ⭐ description = prompt engineering. Model ISI se decide karta hai.
      description:
        'Catalog mein products dhoondo. Jab user koi cheez dekhna/kharidna chahe, ' +
        'price poochhe, ya "kya available hai" jaisa sawal kare tab use karo. ' +
        'Khaali query bhejne par sab products aate hain. ' +
        'AGAR user ne budget ya price range batayi ho to minPrice/maxPrice ZAROOR bhejo — ' +
        'filter khud mat karo, wo is tool ka kaam hai. Misal: ' +
        '"1.5 lakh se 2.2 lakh tak" => minPrice: 150000, maxPrice: 220000. ' +
        '"1 lakh se kam" => maxPrice: 100000.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Product ka naam ya keyword, e.g. "laptop"' },
          category: { type: 'string', description: 'Optional category filter' },
          minPrice: { type: 'number', description: 'Optional — is price se mehngay (inclusive)' },
          maxPrice: { type: 'number', description: 'Optional — is price se saste (inclusive)' },
        },
        required: ['query'],
      },
      side: 'server',
      risk: 'low',
    },
    {
      name: 'get_order_status',
      description:
        'Ek order ka current status aur uske items nikalo. Jab user apne order ' +
        'ke baare mein poochhe (e.g. "ORD-1003 kahan pahuncha") tab use karo.',
      input_schema: {
        type: 'object',
        properties: {
          orderNumber: { type: 'string', description: 'Order number, e.g. "ORD-1003"' },
        },
        required: ['orderNumber'],
      },
      side: 'server',
      risk: 'low',
    },
    {
      name: 'list_recent_orders',
      description: 'Sabse naye orders ki list. "meri recent orders dikhao" jaise sawal ke liye.',
      input_schema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Kitne orders — default 5, max 20' },
        },
      },
      side: 'server',
      risk: 'low',
    },
    {
      name: 'sales_report',
      description:
        'Sales ka aggregate report banao (category ya status ke hisaab se). ' +
        'Report/analytics/chart/revenue wale sawalon ke liye use karo.',
      input_schema: {
        type: 'object',
        properties: {
          groupBy: {
            type: 'string',
            enum: ['category', 'status'],
            description: 'Kis cheez ke hisaab se group karna hai',
          },
        },
        required: ['groupBy'],
      },
      side: 'server',
      risk: 'low',
    },
    {
      name: 'cancel_order',
      // 🔴 HIGH RISK — ye DB badalta hai, isliye pehle user ki approval lagegi
      description:
        'Ek order ko cancel karo. Ye destructive action hai — sirf tab jab user ' +
        'saaf saaf cancel karne ko kahe.',
      input_schema: {
        type: 'object',
        properties: {
          orderNumber: { type: 'string' },
          reason: { type: 'string', description: 'Cancel karne ki wajah' },
        },
        required: ['orderNumber'],
      },
      side: 'server',
      risk: 'high',
    },
  ];

  has(name: string): boolean {
    return this.definitions.some((d) => d.name === name);
  }

  definition(name: string): ToolDefinition | undefined {
    return this.definitions.find((d) => d.name === name);
  }

  /* ================================================================
   *  2. EXECUTION — asli kaam, asli SQL
   * ================================================================ */
  async execute(name: string, args: Record<string, any>): Promise<any> {
    switch (name) {
      case 'search_products':
        return this.searchProducts(args);
      case 'get_order_status':
        return this.getOrderStatus(args);
      case 'list_recent_orders':
        return this.listRecentOrders(args);
      case 'sales_report':
        return this.salesReport(args);
      case 'cancel_order':
        return this.cancelOrder(args);
      default:
        // Model kabhi kabhi ghalat naam bhi bol deta hai — crash mat hone do
        throw new Error('Unknown server tool: ' + name);
    }
  }

  /* ---------------- individual tools ---------------- */

  private async searchProducts(args: any) {
    const where: any = {};
    if (args.query) where.name = ILike('%' + args.query + '%');
    if (args.category) where.category = ILike('%' + args.category + '%');
    // Price range — teen soortein: dono, sirf min, sirf max
    const min = typeof args.minPrice === 'number' ? args.minPrice : undefined;
    const max = typeof args.maxPrice === 'number' ? args.maxPrice : undefined;
    if (min !== undefined && max !== undefined) where.price = Between(min, max);
    else if (min !== undefined) where.price = MoreThanOrEqual(min);
    else if (max !== undefined) where.price = LessThanOrEqual(max);

    const rows = await this.products.find({
      where: Object.keys(where).length ? where : undefined,
      order: { rating: 'DESC' },
      take: 12,
    });

    // 💡 MODULE 1 / DAY 5 — STRUCTURED OUTPUT.
    // Ye shape frontend ke ProductGrid component se exactly match karti hai,
    // isliye UI bina kisi parsing ke seedha render kar leta hai.
    return {
      query: args.query ?? '',
      priceRange: { min: min ?? null, max: max ?? null },
      count: rows.length,
      products: rows.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        price: p.price,
        category: p.category,
        emoji: p.emoji,
        rating: p.rating,
        inStock: p.stock > 0,
        stock: p.stock,
      })),
    };
  }

  private async getOrderStatus(args: any) {
    const order = await this.orders.findOne({
      where: { orderNumber: String(args.orderNumber ?? '').toUpperCase() },
    });
    if (!order) {
      // Error throw karne ke bajaye "not found" wapas dete hain —
      // model isay padh kar user se dobara poochh sakta hai.
      return { found: false, message: 'Order ' + args.orderNumber + ' nahi mila.' };
    }
    return {
      found: true,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      customerName: order.customerName,
      createdAt: order.createdAt,
      items: order.items.map((i) => ({
        name: i.productName,
        qty: i.quantity,
        unitPrice: i.unitPrice,
      })),
    };
  }

  private async listRecentOrders(args: any) {
    const limit = Math.min(Math.max(Number(args.limit ?? 5), 1), 20);
    const rows = await this.orders.find({ order: { createdAt: 'DESC' }, take: limit });
    return {
      count: rows.length,
      orders: rows.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        customerName: o.customerName,
        itemCount: o.items?.length ?? 0,
        createdAt: o.createdAt,
      })),
    };
  }

  private async salesReport(args: any) {
    const groupBy = args.groupBy === 'status' ? 'status' : 'category';

    if (groupBy === 'status') {
      // Raw query builder — TypeORM se aggregate SQL
      const raw = await this.orders
        .createQueryBuilder('o')
        .select('o.status', 'label')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(o.total)', 'value')
        .groupBy('o.status')
        .getRawMany();

      return {
        title: 'Orders by status',
        groupBy,
        rows: raw.map((r) => ({
          label: r.label,
          count: Number(r.count),
          value: Math.round(Number(r.value ?? 0)),
        })),
      };
    }

    const raw = await this.orders
      .createQueryBuilder('o')
      .innerJoin('order_items', 'i', 'i."orderId" = o.id')
      .innerJoin('products', 'p', 'p.id::text = i."productId"')
      .select('p.category', 'label')
      .addSelect('SUM(i."unitPrice" * i.quantity)', 'value')
      .addSelect('SUM(i.quantity)', 'count')
      .groupBy('p.category')
      .orderBy('value', 'DESC')
      .getRawMany();

    return {
      title: 'Revenue by category',
      groupBy,
      rows: raw.map((r) => ({
        label: r.label,
        count: Number(r.count),
        value: Math.round(Number(r.value ?? 0)),
      })),
    };
  }

  private async cancelOrder(args: any) {
    const orderNumber = String(args.orderNumber ?? '').toUpperCase();
    const order = await this.orders.findOne({ where: { orderNumber } });

    if (!order) return { cancelled: false, orderNumber, message: 'Order nahi mila.' };
    if (order.status === 'delivered') {
      // 🔒 Business rule server par — client se aayi "approval" par andha bharosa nahi.
      return { cancelled: false, orderNumber, message: 'Delivered order cancel nahi ho sakta.' };
    }
    if (order.status === 'cancelled') {
      return { cancelled: true, orderNumber, message: 'Ye order pehle se cancelled hai.' };
    }

    order.status = 'cancelled';
    await this.orders.save(order);
    this.log.warn('Order cancelled by agent: ' + orderNumber);

    return { cancelled: true, orderNumber, status: 'cancelled', reason: args.reason ?? null };
  }
}
