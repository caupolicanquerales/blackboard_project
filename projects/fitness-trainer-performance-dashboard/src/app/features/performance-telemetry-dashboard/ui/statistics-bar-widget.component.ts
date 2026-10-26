import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-statistics-bar-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'statistics-bar-widget', 'data-region': 'statistics-bar' },
  template: `
    <div
      class="meter"
      role="meter"
      tabindex="0"
      aria-label="Intensity versus target"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-valuenow]="intensityPct()"
      [attr.aria-valuetext]="intensityPct() + '% intensity, target ' + targetPct() + '%'"
    >
      <div class="layer target-layer" [style.width.%]="targetPct()"></div>
      <div class="layer intensity-layer" [style.width.%]="intensityPct()"></div>
    </div>
    <div class="labels">
      <span class="label intensity-label">Intensity: {{ intensityPct() }}%</span>
      <span class="label target-label">Target: {{ targetPct() }}%</span>
    </div>
  `,
  styles: `
    :host {
      --sb-bg: #121212;
      --sb-accent: #ff5722;
      --sb-accent-end: #ff1744;
      --sb-track: #2a2a2a;
      --sb-target: #8a8a8a;
      --sb-text: #f5f5f5;
      display: grid;
      grid-area: stats;
      grid-template-columns: minmax(0, 1fr);
      gap: 8px;
      align-items: center;
      min-width: 0;
      color: var(--sb-text);
    }
    .meter {
      position: relative;
      height: 1.25rem;
      background: var(--sb-track);
      border-radius: 0.5rem;
      overflow: hidden;
    }
    .meter:focus-visible { outline: 2px solid var(--sb-accent); outline-offset: 3px; }
    .layer { position: absolute; top: 0; left: 0; height: 100%; border-radius: inherit; transition: width 300ms ease; }
    .target-layer { background: var(--sb-target); }
    .intensity-layer { height: 50%; top: 25%; background: linear-gradient(90deg, var(--sb-accent), var(--sb-accent-end)); }
    .labels { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; font-size: 0.8125rem; }
    .label { font-weight: 700; font-style: italic; text-transform: uppercase; letter-spacing: 0.04em; }
    .intensity-label { color: #ff8a65; }
    .target-label { color: #cfcfcf; }
    @media (prefers-reduced-motion: reduce) { .layer { transition: none; } }
    @media (max-width: 768px) { :host { grid-template-columns: 1fr; } }
  `,
})
export class StatisticsBarWidgetComponent {
  readonly intensity = input<number>(0);
  readonly target = input<number>(0);

  protected readonly intensityPct = computed(() => this.clamp(this.intensity()));
  protected readonly targetPct = computed(() => this.clamp(this.target()));

  private clamp(v: number): number {
    return Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : 0;
  }
}
