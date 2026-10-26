import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconName } from '../models/icon-name.model';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-icon', '[style.--icon-size.px]': 'size()' },
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
      [attr.width]="size()"
      [attr.height]="size()"
    >
      @switch (name()) {
        @case ('heart') {
          <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" />
        }
        @case ('lungs') {
          <path d="M12 4v8" />
          <path d="M12 8c-1 0-2 1-3 3l-3 6c-.6 1.6.4 3 2 3h1c1.7 0 3-1.3 3-3z" />
          <path d="M12 8c1 0 2 1 3 3l3 6c.6 1.6-.4 3-2 3h-1c-1.7 0-3-1.3-3-3z" />
        }
        @case ('dumbbell') {
          <path d="M6 7v10M3 9.5v5M18 7v10M21 9.5v5M6 12h12" />
        }
        @case ('chevron-left') {
          <path d="M15 5l-7 7 7 7" />
        }
        @case ('chevron-right') {
          <path d="M9 5l7 7-7 7" />
        }
        @case ('chevron-step') {
          <path d="M6 7l5 5-5 5M13 7l5 5-5 5" />
        }
        @case ('check') {
          <path d="M4 12.5l5 5L20 6.5" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: var(--icon-size, 20px);
      height: var(--icon-size, 20px);
      color: inherit;
      line-height: 0;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
      stroke: currentColor;
      shape-rendering: geometricPrecision;
    }
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input<number>(20);
}
