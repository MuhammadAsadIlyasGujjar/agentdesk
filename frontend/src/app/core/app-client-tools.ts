import { Router } from '@angular/router';
import { inject, provideAppInitializer } from '@angular/core';
import { ClientTool, ClientToolRegistry } from '@masad-ilyas-gujar/ngx-agui';
import { CartStore } from './services/cart.store';

/**
 * ============================================================
 *  IS APP KE CLIENT-SIDE TOOLS
 * ============================================================
 * Package sirf registry deta hai — tools aapke hote hain.
 *
 * Client tool kab banayein? Jab data ya capability SIRF browser mein ho:
 *   - cart signal      -> server ke paas hai hi nahi
 *   - navigation       -> Angular Router ka kaam
 *   - user se poochhna -> UI ke bagair mumkin nahi
 */
export function provideAppClientTools() {
  return provideAppInitializer(() => {
    const registry = inject(ClientToolRegistry);
    const router = inject(Router);
    const cart = inject(CartStore);

    const tools: ClientTool[] = [
      {
        name: 'ask_user_confirmation',
        description:
          'User se haan/na poochho. Koi bhi aisa kaam karne se pehle use karo jo ' +
          'undo na ho sake, ya jab user ka irada saaf na ho.',
        input_schema: {
          type: 'object',
          properties: { message: { type: 'string', description: 'User ko dikhane wala sawal' } },
          required: ['message'],
        },
        execute: async ({ message }) => ({
          confirmed: await registry.askConfirmation(String(message)),
        }),
      },
      {
        name: 'navigate_to',
        description: 'App ke kisi page par le jao. Available routes: "/chat", "/shop", "/orders".',
        input_schema: {
          type: 'object',
          properties: { route: { type: 'string', description: 'Route path, e.g. "/shop"' } },
          required: ['route'],
        },
        execute: async ({ route }) => {
          // 🛡️ Allowlist — model ko jahan mann kare wahan mat jaane do
          const allowed = ['/chat', '/shop', '/orders'];
          const target = String(route ?? '');
          if (!allowed.includes(target)) {
            return { navigated: false, error: 'Route allowed nahi: ' + target };
          }
          await router.navigateByUrl(target);
          return { navigated: true, route: target };
        },
      },
      {
        name: 'get_cart_contents',
        description:
          'User ki current shopping cart parho (items, quantity, total). ' +
          'Cart sirf browser mein hai — server ke paas nahi.',
        input_schema: { type: 'object', properties: {} },
        execute: async () => ({
          items: cart.lines().map((l) => ({
            name: l.name, qty: l.qty, price: l.price, lineTotal: l.qty * l.price,
          })),
          total: cart.total(),
          count: cart.count(),
        }),
      },
    ];

    registry.registerAll(tools);
  });
}
