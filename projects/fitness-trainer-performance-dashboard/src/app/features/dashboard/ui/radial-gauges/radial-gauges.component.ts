import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PhaseProgress } from '../../../../shared/models/phase-progress.model';
import { ViewState } from '../../../../shared/models/view-state.model';

const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

@Component({
  imports: [],
  selector: 'app-radial-gauges',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './radial-gauges.component.scss',
  templateUrl: './radial-gauges.component.html',
})
export class RadialGaugesComponent {
  phases = input.required<readonly PhaseProgress[]>();
  state = input<ViewState>('success');

  readonly radius = RADIUS;
  readonly circumference = CIRCUMFERENCE;

  gauges = computed(() =>
    this.phases()
      .slice(0, 2)
      .map((phase) => {
        const percent = Math.min(100, Math.max(0, Math.round(phase.completionPercentage)));
        return {
          id: phase.id,
          name: phase.phaseName,
          percent,
          offset: CIRCUMFERENCE * (1 - percent / 100),
        };
      }),
  );
}
