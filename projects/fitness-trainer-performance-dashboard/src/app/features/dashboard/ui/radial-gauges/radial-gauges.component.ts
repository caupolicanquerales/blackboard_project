import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GaugeValue } from '../../data/dashboard.model';

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

@Component({
  imports: [],
  selector: 'app-radial-gauges',
  styleUrl: './radial-gauges.component.scss',
  templateUrl: './radial-gauges.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadialGaugesComponent {
  readonly gauges = input<GaugeValue[]>([]);

  protected readonly radius = RADIUS;
  protected readonly circumference = CIRCUMFERENCE;

  protected readonly rings = computed(() =>
    this.gauges().map((gauge) => {
      const pct = Math.min(100, Math.max(0, gauge.percentage));
      return { ...gauge, percentage: pct, offset: CIRCUMFERENCE * (1 - pct / 100) };
    }),
  );
}
