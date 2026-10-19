import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { WorkoutStep } from '../../models/workout.model';

@Component({
  imports: [],
  selector: 'app-exercise-step-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './exercise-step-cards.component.scss',
  templateUrl: './exercise-step-cards.component.html',
})
export class ExerciseStepCardsComponent {
  readonly steps = input.required<WorkoutStep[]>();
  readonly selectedStepId = input<string | null>(null);
  readonly stepSelected = output<string>();

  protected select(id: string): void {
    this.stepSelected.emit(id);
  }
}
