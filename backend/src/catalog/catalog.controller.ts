import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('products')
  products(@Query('q') q?: string) {
    return this.catalog.findProducts(q);
  }

  @Get('products/:id')
  product(@Param('id') id: string) {
    return this.catalog.findProduct(id);
  }

  @Get('orders')
  orders() {
    return this.catalog.findOrders();
  }

  @Get('orders/:orderNumber')
  order(@Param('orderNumber') orderNumber: string) {
    return this.catalog.findOrder(orderNumber);
  }

  /** Docker healthcheck / "kya API zinda hai" */
  @Get('health')
  health() {
    return { status: 'ok', time: new Date().toISOString() };
  }
}
