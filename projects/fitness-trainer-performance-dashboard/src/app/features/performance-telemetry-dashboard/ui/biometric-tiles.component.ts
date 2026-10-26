import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from '../../../shared/ui/icon.component';
import { IconName } from '../../../shared/models/icon-name.model';
import { BiometricMetric } from '../data/biometric-metric.model';
import { TelemetryStatus } from '../data/telemetry.store';

interface Tile {
  key: string;
  label: string;
  icon: IconName;
  value: number;
  unit: string;
}

@Component({
  selector: 'app-biometric-tiles',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'biometric-tiles', 'data-region': 'biometric-tiles' },
  template: `
    @switch (status()) {
      @case ('loading') {
        <p class="state" role="status">Loading biometrics…</p>
      }
      @case ('error') {
        <p class="state" role="alert">Unable to load biometrics.</p>
      }
      @case ('empty') {
        <p class="state" role="status">No biometric data available.</p>
      }
      @default {
        @if (tiles(); as list) {
          <ul class="tiles">
            @for (tile of list; track tile.key) {
              <li class="tile" role="group" tabindex="0" [attr.aria-label]="tile.label + ': ' + tile.value + ' ' + tile.unit">
                <app-icon [name]="tile.icon" [size]="24" />
                <span class="label">{{ tile.label }}</span>
                <span class="value">{{ tile.value }} <small>{{ tile.unit }}</small></span>
              </li>
            }
          </ul>
        } @else {
          <p class="state" role="status">No biometric data available.</p>
        }
      }
    }
  `,
  styles: `
    :host {
      --bt-bg: #121212;
      --bt-surface: #1c1c1c;
      --bt-accent: #ff5a1f;
      --bt-text: #f5f5f5;
      --bt-muted: #c4c4c4;
      display: block;
      grid-area: tiles;
      min-width: 0;
      color: var(--bt-text);
    }
    .tiles {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
      align-items: stretch;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .tile {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
      padding: 16px;
      background: var(--bt-surface);
      border: 2px solid var(--bt-accent);
      border-radius: 12px;
      box-shadow: 0 0 12px rgba(255, 90, 31, 0.45), inset 0 0 8px rgba(255, 90, 31, 0.15);
      color: var(--bt-accent);
      transition: box-shadow 0.2s ease;
    }
    .tile:hover,
    .tile:focus-within { box-shadow: 0 0 20px rgba(255, 90, 31, 0.7), inset 0 0 10px rgba(255, 90, 31, 0.2); }
    .tile:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
    .label {
      color: var(--bt-muted);
      font-style: italic;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.8rem;
    }
    .value {
      color: var(--bt-text);
      font-size: clamp(2rem, 5vw, 3.25rem);
      font-weight: 800;
      font-style: italic;
      line-height: 1;
      overflow-wrap: anywhere;
    }
    .value small { font-size: 0.9rem; color: var(--bt-muted); font-weight: 600; }
    .state { margin: 0; padding: 16px; color: var(--bt-muted); border: 1px dashed var(--bt-accent); border-radius: 12px; }
    @media (max-width: 768px) {
      .tiles { grid-template-columns: 1fr; }
    }
    @media (prefers-reduced-motion: reduce) {
      .tile { transition: none; }
    }
  `,
})
export class BiometricTilesComponent {
  readonly metric = input<BiometricMetric | null>(null);
  readonly status = input<TelemetryStatus>('loading');

  protected readonly tiles = computed<Tile[] | null>(() => {
    const m = this.metric();
    if (!m) return null;
    return [
      { key: 'hr', label: 'Heart rate', icon: 'heart', value: m.heartRate, unit: 'bpm' },
      { key: 'rr', label: 'Respiratory rate', icon: 'lungs', value: m.respiratoryRate, unit: 'rpm' },
      { key: 'tl', label: 'Training load', icon: 'dumbbell', value: m.trainingLoad, unit: 'kg' },
    ];
  });
}
