import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TrainingRatio } from '../data/training-ratio.model';
import { TelemetryStatus } from '../data/telemetry.store';

@Component({
  selector: 'app-comparison-split-bars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'comparison-split-bars', 'data-region': 'comparison-bars' },
  template: `
    @switch (status()) {
      @case ('loading') {
        <p class="state" role="status">Loading comparison…</p>
      }
      @case ('error') {
        <p class="state" role="alert">Unable to load comparison.</p>
      }
      @default {
        @if (ratios().length) {
          <ul class="bars">
            @for (r of ratios(); track r.id) {
              <li class="bar-item">
                <span class="category">{{ r.categoryLabel }}</span>
                <div
                  class="bar"
                  role="progressbar"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  [attr.aria-valuenow]="r.primaryPercentage"
                  [attr.aria-label]="r.categoryLabel + ': ' + r.primaryPercentage + '% primary, ' + r.secondaryPercentage + '% secondary'"
                >
                  <span class="segment primary" [style.width.%]="r.primaryPercentage">{{ r.primaryPercentage }}%</span>
                  <span class="segment secondary" [style.width.%]="r.secondaryPercentage">{{ r.secondaryPercentage }}%</span>
                </div>
              </li>
            }
          </ul>
        } @else {
          <p class="state" role="status">No comparison data available.</p>
        }
      }
    }
    <button type="button" class="reset" (click)="resetRequested.emit()">Reset</button>
  `,
  styles: `
    :host {
      --cb-surface: #1c1c1c;
      --cb-accent: #ff5a1f;
      --cb-accent-end: #c4122a;
      --cb-fill-start: #c93a0c;
      --cb-secondary: #3a3a3a;
      --cb-text: #f5f5f5;
      --cb-muted: #c4c4c4;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
      align-items: center;
      grid-area: bars;
      min-width: 0;
      color: var(--cb-text);
    }
    .bars { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
    .category { display: block; margin-bottom: 6px; color: var(--cb-muted); font-weight: 700; font-style: italic; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.06em; }
    .bar { display: flex; width: 100%; height: 32px; overflow: hidden; border-radius: 8px; background: var(--cb-surface); }
    .segment { display: flex; align-items: center; justify-content: center; min-width: 0; font-weight: 700; font-size: 0.875rem; overflow: hidden; white-space: nowrap; transition: width 0.4s ease; }
    .primary { background-color: var(--cb-fill-start); background-image: linear-gradient(90deg, var(--cb-fill-start), var(--cb-accent-end)); color: var(--cb-text); }
    .secondary { background: var(--cb-secondary); color: var(--cb-text); }
    .state { margin: 0; padding: 16px; color: var(--cb-muted); border: 1px dashed var(--cb-accent); border-radius: 12px; }
    .reset { justify-self: start; padding: 8px 16px; background: transparent; color: var(--cb-accent); border: 2px solid var(--cb-accent); border-radius: 8px; font-weight: 700; font-style: italic; cursor: pointer; transition: background 0.2s ease, color 0.2s ease; }
    .reset:hover { background: var(--cb-accent); color: #000; }
    .reset:focus-visible, .bar:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
    @media (max-width: 768px) {
      :host { grid-area: auto; grid-template-columns: minmax(0, 1fr); }
      .segment { font-size: 0.75rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      .segment, .reset { transition: none; }
    }
  `,
})
export class ComparisonSplitBarsComponent {
  readonly ratios = input<TrainingRatio[]>([]);
  readonly status = input<TelemetryStatus>('loading');
  readonly resetRequested = output<void>();
}
