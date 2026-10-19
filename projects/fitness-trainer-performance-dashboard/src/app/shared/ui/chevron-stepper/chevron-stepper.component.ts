import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PhaseProgress } from '../../models/workout.model';

@Component({
  imports: [],
  selector: 'app-chevron-stepper',
  styleUrl: './chevron-stepper.component.scss',
  templateUrl: './chevron-stepper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChevronStepperComponent {
  readonly phases = input.required<PhaseProgress[]>();

  protected readonly steps = computed(() =>
    this.phases()
      .slice(0, 4)
      .map((phase, index) => ({
        ...phase,
        label: `STEP ${String(index + 1).padStart(2, '0')}`,
      })),
  );
}
