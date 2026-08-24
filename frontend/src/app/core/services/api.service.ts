import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ProductDto {
  id: string; sku: string; name: string; description: string;
  category: string; price: number; stock: number; emoji: string; rating: number;
}

export interface OrderDto {
  id: string; orderNumber: string; customerName: string; customerEmail: string;
  status: string; total: number; createdAt: string;
  items: Array<{ productName: string; quantity: number; unitPrice: number }>;
}

/** Normal REST — Shop aur Orders pages ke liye (agent se alag) */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  products(q?: string): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>('/api/products', { params: q ? { q } : {} });
  }

  orders(): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>('/api/orders');
  }
}
