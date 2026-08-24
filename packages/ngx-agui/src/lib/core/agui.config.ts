import { InjectionToken, Provider, Type } from '@angular/core';

export interface AgUiConfig {
  /** Naya turn shuru karne ka endpoint (SSE wapas karta hai) */
  streamUrl: string;
  /** Ruke hue run ko aage badhane ka endpoint (SSE wapas karta hai) */
  resumeUrl: string;
  /**
   * Tool ka naam -> Angular component. Tool ka result usi component mein
   * render hota hai. Jo tool yahan nahi hai uske liye fallback chalta hai.
   */
  toolViews?: Record<string, Type<unknown>>;
  /** Unknown tool ke liye component (default: built-in JSON viewer) */
  fallbackView?: Type<unknown>;
  /** Har request ke saath extra headers (auth waghera) */
  headers?: () => Record<string, string>;
  /** Context bachane ke liye kitne messages bhejne hain (backend ko hint) */
  maxContextMessages?: number;
}

export const AGUI_CONFIG = new InjectionToken<AgUiConfig>('AGUI_CONFIG');

/**
 * App bootstrap mein lagayein:
 *
 * ```ts
 * providers: [
 *   provideAgUi({
 *     streamUrl: '/api/agent/stream',
 *     resumeUrl: '/api/agent/resume',
 *     toolViews: { search_products: ProductGridComponent },
 *   }),
 * ]
 * ```
 */
export function provideAgUi(config: AgUiConfig): Provider[] {
  return [{ provide: AGUI_CONFIG, useValue: config }];
}
