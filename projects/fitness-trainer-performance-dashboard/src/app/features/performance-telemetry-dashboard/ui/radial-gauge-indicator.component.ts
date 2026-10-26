import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface RadialGaugeValue {
  label: string;
  percentage: number;
}

interface Gauge {
  label: string;
  percent: number;
  offset: number;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

@Component({
  selector: 'app-radial-gauge-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'radial-gauge-indicator', 'data-region': 'radial-gauges' },
  template: `
    <div class="gauges">
      @for (g of gauges(); track $index) {
        <div class="gauge">
          <svg
            tabindex="0"
            viewBox="0 0 120 120"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            [attr.aria-valuenow]="g.percent"
            [attr.aria-label]="g.label"
          >
            <circle class="track" cx="60" cy="60" [attr.r]="radius" fill="none" stroke-width="10" />
            <circle
              class="ring"
              cx="60"
              cy="60"
              [attr.r]="radius"
              fill="none"
              stroke-width="10"
              stroke-linecap="round"
              transform="rotate(-90 60 60)"
              [attr.stroke-dasharray]="circumference"
              [attr.stroke-dashoffset]="g.offset"
            />
            <text class="value" x="60" y="60" text-anchor="middle" dominant-baseline="central">{{ g.percent }}%</text>
          </svg>
          <span class="label">{{ g.label }}</span>
        </div>
      } @empty {
        <p class="state" role="status">No gauge data available.</p>
      }
    </div>
  `,
  styles: `
    :host {
      --pt-accent: #ff5a1f;
      --pt-track: #2a2a2a;
      --pt-text: #f5f5f5;
      --pt-muted: #c4c4c4;
      display: block;
      grid-area: gauges;
      min-width: 0;
      color: var(--pt-text);
    }
    .gauges {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      align-items: center;
      justify-items: center;
    }
    .gauge:focus-visible, svg:focus-visible {
      outline: 3px solid var(--pt-accent);
      outline-offset: 4px;
      border-radius: 8px;
    }
    .ring { transition: stroke-dashoffset 0.6s ease; }
    @media (prefers-reduced-motion: reduce) {
      .ring { transition: none; }
    }
    .state { grid-column: 1 / -1; text-align: center; }
    .gauge {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: 100%;
      max-width: 140px;
    }
    svg { width: 100%; height: auto; }
    .track { stroke: var(--pt-track); }
    .ring { stroke: var(--pt-accent); }
    .value { fill: var(--pt-text); font-size: 24px; font-weight: 800; font-style: italic; }
    .label {
      text-align: center;
      font-size: 0.75rem;
      font-weight: 800;
      font-style: italic;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--pt-muted);
    }
    .state { color: var(--pt-muted); }
  `,
})
export class RadialGaugeIndicatorComponent {
  readonly values = input<RadialGaugeValue[]>([]);

  protected readonly radius = RADIUS;
  protected readonly circumference = CIRCUMFERENCE;

  protected readonly gauges = computed<Gauge[]>(() =>
    this.values()
      .slice(0, 2)
      .map((v) => {
        const percent = Math.round(Math.min(100, Math.max(0, Number(v.percentage) || 0)));
        return { label: v.label, percent, offset: CIRCUMFERENCE * (1 - percent / 100) };
      }),
  );
}
