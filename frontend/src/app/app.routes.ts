import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'chat', pathMatch: 'full' },
  {
    path: 'chat',
    // Lazy loading — component tabhi download hoga jab route khulega
    loadComponent: () => import('./features/chat/chat.component').then((m) => m.ChatComponent),
  },
  {
    path: 'shop',
    loadComponent: () => import('./features/shop/shop.component').then((m) => m.ShopComponent),
  },
  {
    path: 'orders',
    loadComponent: () => import('./features/orders/orders.component').then((m) => m.OrdersComponent),
  },
  { path: '**', redirectTo: 'chat' },
];
