import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';

import { ChevronStepperComponent } from '../../../shared/ui/chevron-stepper/chevron-stepper.component';
import { ExerciseStepCardsComponent } from '../../../shared/ui/exercise-step-cards/exercise-step-cards.component';
import { RoutinesStore } from '../data/routines.store';
import { StepDetailComponent } from '../ui/step-detail/step-detail.component';

@Component({
  imports: [ChevronStepperComponent, ExerciseStepCardsComponent, StepDetailComponent],
  providers: [RoutinesStore],
  selector: 'app-routines-page',
  styleUrl: './routines-page.component.scss',
  templateUrl: './routines-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutinesPageComponent implements OnInit {
  protected readonly store = inject(RoutinesStore);

  ngOnInit(): void {
    this.store.load('default');
  }
}
