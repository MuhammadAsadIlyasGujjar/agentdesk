import { Injectable, signal } from '@angular/core';

export interface ClientToolSchema {
  name: string;
  /** ⭐ Model ISI ko padh kar decide karta hai — ise prompt samjhein */
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ClientTool extends ClientToolSchema {
  /** Asli implementation — ye BROWSER mein chalta hai */
  execute: (args: Record<string, any>) => Promise<unknown>;
}

/**
 * CLIENT-SIDE TOOLS — AG-UI ka sabse qeemti feature.
 *
 * Kuch cheezein sirf browser mein hoti hain: current route, form state,
 * geolocation, clipboard, ya user se sawal poochhna. Server unhe chhoo bhi
 * nahi sakta. Ye registry unhe model ke liye "tools" bana deti hai.
 *
 * Flow:
 *   1. `getSchemas()` backend ko jate hain (execute ke bagair)
 *   2. backend unhe LLM ko de deta hai
 *   3. LLM kehta hai "navigate_to chalao"
 *   4. backend TOOL_CALL_START bhej kar ruk jata hai
 *   5. ye registry `execute()` chalati hai            <- browser mein
 *   6. natija /resume par wapas jata hai
 *
 * ⚠️ SECURITY: ye code user ke browser mein hai — wo isay parh aur badal
 * sakta hai. Yahan kabhi secret ya trust-critical logic mat rakhein, aur
 * server ko is ke natije par andha bharosa nahi karna chahiye.
 */
@Injectable({ providedIn: 'root' })
export class ClientToolRegistry {
  private readonly tools = new Map<string, ClientTool>();

  /** Jab kisi tool ko user se poochhna ho to ye bhar jata hai */
  readonly confirmRequest = signal<{ message: string; resolve: (ok: boolean) => void } | null>(null);

  register(tool: ClientTool): void {
    this.tools.set(tool.name, tool);
  }

  registerAll(tools: ClientTool[]): void {
    tools.forEach((t) => this.register(t));
  }

  unregister(name: string): void {
    this.tools.delete(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  /** Backend ko sirf schema jata hai — `execute` function JSON mein nahi ja sakta */
  getSchemas(): ClientToolSchema[] {
    return [...this.tools.values()].map(({ name, description, input_schema }) => ({
      name,
      description,
      input_schema,
    }));
  }

  async execute(name: string, args: Record<string, any>): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error('Client tool registered nahi hai: ' + name);
    return tool.execute(args ?? {});
  }

  /**
   * Built-in helper: user se haan/na poochho.
   * Promise tab tak latka rehta hai jab tak user button na dabaye —
   * human-in-the-loop ka sabse seedha implementation.
   */
  async askConfirmation(message: string): Promise<boolean> {
    const confirmed = await new Promise<boolean>((resolve) => {
      this.confirmRequest.set({ message, resolve });
    });
    this.confirmRequest.set(null);
    return confirmed;
  }

  answerConfirmation(ok: boolean): void {
    this.confirmRequest()?.resolve(ok);
  }
}
