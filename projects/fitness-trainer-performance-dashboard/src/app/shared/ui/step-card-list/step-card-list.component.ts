import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { ViewState } from '../../models/view-state.model';
import { WorkoutStep } from '../../models/workout-step.model';

@Component({
  imports: [IconComponent],
  selector: 'app-step-card-list',
  styleUrl: './step-card-list.component.scss',
  templateUrl: './step-card-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepCardListComponent {
  steps = input.required<readonly WorkoutStep[]>();
  state = input<ViewState>('success');
  selectedStepId = input<string | null>(null);
  showActions = input<boolean>(false);
  stepSelected = output<string>();
  stepCompleted = output<string>();

  onKey(event: Event, id: string): void {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    this.stepSelected.emit(id);
  }

  onComplete(event: Event, id: string): void {
    event.stopPropagation();
    this.stepCompleted.emit(id);
  }
}
