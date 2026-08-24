import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAgUi } from '@masad-ilyas-gujar/ngx-agui';

import { routes } from './app.routes';
import { provideAppClientTools } from './core/app-client-tools';
import { ProductGridComponent } from './features/chat/tool-views/product-grid.component';
import { OrderStatusComponent } from './features/chat/tool-views/order-status.component';
import { OrdersListComponent } from './features/chat/tool-views/orders-list.component';
import { SalesChartComponent } from './features/chat/tool-views/sales-chart.component';
import { ActionResultComponent } from './features/chat/tool-views/action-result.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),

    // ---- AG-UI client ----
    provideAgUi({
      streamUrl: '/api/agent/stream',
      resumeUrl: '/api/agent/resume',

      // Tool ka naam -> Angular component. Package ko aapke domain ka
      // pata nahi hona chahiye, isliye map yahan se aata hai.
      toolViews: {
        search_products: ProductGridComponent,
        get_order_status: OrderStatusComponent,
        list_recent_orders: OrdersListComponent,
        sales_report: SalesChartComponent,
        cancel_order: ActionResultComponent,
      },
    }),

    // ---- is app ke browser-side tools ----
    provideAppClientTools(),
  ],
};
