import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { ChevronStepperComponent } from '../../../shared/ui/chevron-stepper/chevron-stepper.component';
import { StepCardListComponent } from '../../../shared/ui/step-card-list/step-card-list.component';
import { ViewState } from '../../../shared/models/view-state.model';
import { RoutinesStore } from '../data/routines.store';
import { StepDetailComponent } from '../ui/step-detail/step-detail.component';

@Component({
  imports: [ChevronStepperComponent, StepCardListComponent, StepDetailComponent],
  selector: 'app-routines-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './routines-page.component.scss',
  templateUrl: './routines-page.component.html',
})
export class RoutinesPageComponent implements OnInit {
  protected readonly store = inject(RoutinesStore);

  protected readonly state = computed<ViewState>(() => {
    if (this.store.loading()) return 'loading';
    if (this.store.error()) return 'error';
    if (this.store.steps().length === 0) return 'empty';
    return 'success';
  });

  protected readonly activePhaseId = computed(
    () => this.store.phases().find((p) => p.status === 'IN_PROGRESS')?.id ?? null,
  );

  protected readonly selectedStepId = computed(() => this.store.selectedStep()?.id ?? null);

  ngOnInit(): void {
    this.store.load('default');
  }
}
