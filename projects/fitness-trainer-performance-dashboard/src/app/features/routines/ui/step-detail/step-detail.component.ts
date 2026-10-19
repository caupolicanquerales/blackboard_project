import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { WorkoutStep } from '../../../../shared/models/workout.model';

@Component({
  imports: [],
  selector: 'app-step-detail',
  styleUrl: './step-detail.component.scss',
  templateUrl: './step-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepDetailComponent {
  readonly step = input<WorkoutStep | null>(null);
  readonly completed = output<void>();
  readonly advanced = output<void>();
}
