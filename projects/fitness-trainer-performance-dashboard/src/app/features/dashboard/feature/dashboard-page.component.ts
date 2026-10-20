import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DashboardStore } from '../data/dashboard.store';
import { BiometricTelemetryService } from '../../../core/biometrics/biometric-telemetry.service';
import { ViewState } from '../../../shared/models/view-state.model';
import { BiometricTilesComponent } from '../ui/biometric-tiles/biometric-tiles.component';
import { ComparisonSplitBarsComponent } from '../ui/comparison-split-bars/comparison-split-bars.component';
import { RadialGaugesComponent } from '../ui/radial-gauges/radial-gauges.component';
import { StatisticsBarComponent } from '../ui/statistics-bar/statistics-bar.component';
import { ChevronStepperComponent } from '../../../shared/ui/chevron-stepper/chevron-stepper.component';
import { StepCardListComponent } from '../../../shared/ui/step-card-list/step-card-list.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    BiometricTilesComponent,
    ComparisonSplitBarsComponent,
    RadialGaugesComponent,
    ChevronStepperComponent,
    StepCardListComponent,
    StatisticsBarComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  protected readonly store = inject(DashboardStore);
  protected readonly telemetry = inject(BiometricTelemetryService);

  private resolve(loading: boolean, error: string | null, empty: boolean): ViewState {
    if (loading) return 'loading';
    if (error) return 'error';
    return empty ? 'empty' : 'success';
  }

  protected readonly metricState = computed<ViewState>(() =>
    this.resolve(this.telemetry.loading(), this.telemetry.error(), this.telemetry.metric() === null),
  );
  protected readonly ratiosState = computed<ViewState>(() =>
    this.resolve(this.store.loading(), this.store.error(), this.store.ratios().length === 0),
  );
  protected readonly phasesState = computed<ViewState>(() =>
    this.resolve(this.store.loading(), this.store.error(), this.store.phases().length === 0),
  );
  protected readonly stepsState = computed<ViewState>(() =>
    this.resolve(this.store.loading(), this.store.error(), this.store.steps().length === 0),
  );

  constructor() {
    this.store.load();
    this.telemetry.loadSnapshot();
  }
}
