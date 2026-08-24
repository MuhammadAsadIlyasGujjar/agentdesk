import {
  ChangeDetectionStrategy, Component, Type, ViewContainerRef,
  effect, inject, input, viewChild,
} from '@angular/core';
import { AGUI_CONFIG } from '../core/agui.config';
import { JsonViewComponent } from './json-view.component';

/**
 * Tool ka naam -> aapka Angular component.
 *
 * Map `provideAgUi({ toolViews })` se aata hai, isliye package ko aapke
 * domain components ka pata nahi hona chahiye. Jo tool map mein nahi,
 * uske liye fallback chalta hai — app kabhi crash nahi hoti.
 */
@Component({
  selector: 'agui-tool-result',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container #host />`,
})
export class ToolResultHostComponent {
  private readonly config = inject(AGUI_CONFIG);

  toolName = input.required<string>();
  result = input<unknown>();

  private host = viewChild.required('host', { read: ViewContainerRef });

  constructor() {
    effect(() => {
      const container = this.host();
      const name = this.toolName();
      const value = this.result();

      container.clear();
      if (value === undefined || value === null) return;

      const component: Type<unknown> =
        this.config.toolViews?.[name] ?? this.config.fallbackView ?? JsonViewComponent;

      const ref = container.createComponent(component);
      // Har view component ko ek hi input milta hai: `data`
      ref.setInput('data', value);
      ref.changeDetectorRef.detectChanges();
    });
  }
}
