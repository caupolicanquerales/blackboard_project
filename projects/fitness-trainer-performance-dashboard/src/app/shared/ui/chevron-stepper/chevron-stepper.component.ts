import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PhaseProgress } from '../../models/phase-progress.model';
import { ViewState } from '../../models/view-state.model';

@Component({
  imports: [],
  selector: 'app-chevron-stepper',
  styleUrl: './chevron-stepper.component.scss',
  templateUrl: './chevron-stepper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChevronStepperComponent {
  readonly phases = input.required<readonly PhaseProgress[]>();
  readonly state = input<ViewState>('success');
  readonly activePhaseId = input<string | null>(null);
  readonly phaseSelected = output<string>();

  protected readonly currentId = computed<string | null>(() => {
    const explicit = this.activePhaseId();
    if (explicit !== null) {
      return explicit;
    }
    return this.phases().find((p) => p.status === 'IN_PROGRESS')?.id ?? null;
  });

  protected select(id: string): void {
    this.phaseSelected.emit(id);
  }
}
