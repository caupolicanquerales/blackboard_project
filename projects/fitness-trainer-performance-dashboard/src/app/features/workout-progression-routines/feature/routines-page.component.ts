import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { WorkoutStore } from '../../../core/state/workout.store';
import { PhaseStepperComponent } from '../ui/phase-stepper.component';
import { StepDetailComponent } from '../ui/step-detail.component';
import { StepListComponent } from '../ui/step-list.component';

@Component({
  selector: 'app-routines-page',
  imports: [PhaseStepperComponent, StepListComponent, StepDetailComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-phase-stepper [phases]="store.phases()" (advanceRequested)="store.advancePhase()" />
    <app-step-list
      [steps]="store.steps()"
      [selectedId]="store.activeStep()?.id ?? null"
      [status]="store.status()"
      (stepSelected)="store.selectStep($event)"
      (stepCompleted)="store.completeStep($event)"
    />
    <app-step-detail [step]="store.activeStep()" (completeRequested)="store.completeStep($event)" />
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
      grid-template-rows: auto 1fr;
      grid-template-areas:
        'stepper stepper'
        'steps detail';
      gap: 16px;
      min-width: 0;
      background: #121212;
      color: #f5f5f5;
    }
    app-phase-stepper { grid-area: stepper; min-width: 0; }
    app-step-list { grid-area: steps; min-width: 0; }
    app-step-detail { grid-area: detail; min-width: 0; }
    @media (max-width: 768px) {
      :host {
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: auto;
        grid-template-areas: 'stepper' 'steps' 'detail';
      }
    }
  `,
})
export class RoutinesPageComponent {
  protected readonly store = inject(WorkoutStore);
}
