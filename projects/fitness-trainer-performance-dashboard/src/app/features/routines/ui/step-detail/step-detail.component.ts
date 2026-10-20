import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ViewState } from '../../../../shared/models/view-state.model';
import { WorkoutStep } from '../../../../shared/models/workout-step.model';

@Component({
  imports: [],
  selector: 'app-step-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './step-detail.component.scss',
  templateUrl: './step-detail.component.html',
})
export class StepDetailComponent {
  step = input.required<WorkoutStep | null>();
  state = input<ViewState>('success');
  completeRequested = output<string>();

  onComplete(step: WorkoutStep): void {
    this.completeRequested.emit(step.id);
  }
}
