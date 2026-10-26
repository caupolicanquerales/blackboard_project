import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject } from '@angular/core';
import { WorkoutStore } from '../../../core/state/workout.store';
import { TelemetryStore } from '../data/telemetry.store';
import { BiometricTilesComponent } from '../ui/biometric-tiles.component';
import { ComparisonSplitBarsComponent } from '../ui/comparison-split-bars.component';
import { ExerciseStepCardsComponent } from '../ui/exercise-step-cards.component';
import { PhaseTimelineComponent } from '../ui/phase-timeline.component';
import { RadialGaugeIndicatorComponent, RadialGaugeValue } from '../ui/radial-gauge-indicator.component';
import { StatisticsBarWidgetComponent } from '../ui/statistics-bar-widget.component';

@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BiometricTilesComponent,
    ComparisonSplitBarsComponent,
    RadialGaugeIndicatorComponent,
    PhaseTimelineComponent,
    ExerciseStepCardsComponent,
    StatisticsBarWidgetComponent,
  ],
  template: `
    <div class="dashboard-grid">
      <app-biometric-tiles class="area-tiles" [metric]="telemetry.metric()" [status]="telemetry.status()" />
      <app-comparison-split-bars
        class="area-bars"
        [ratios]="telemetry.ratios()"
        [status]="telemetry.status()"
        (resetRequested)="telemetry.resetRatios()"
      />
      <app-radial-gauge-indicator class="area-gauges" [values]="gaugeValues()" />
      <app-phase-timeline class="area-timeline" [phases]="workout.phases()" />
      <app-exercise-step-cards
        class="area-cards"
        [steps]="workout.steps()"
        [status]="workout.status()"
        (stepCompleted)="workout.completeStep($event)"
      />
      <app-statistics-bar-widget
        class="area-stats"
        [intensity]="telemetry.intensity()"
        [target]="workout.completedPercentage()"
      />
    </div>
  `,
  styles: `
    :host {
      --dash-bg: #121212;
      --dash-fg: #f5f5f5;
      --dash-accent: #ff5a1f;
      --dash-gap: 16px;
      display: block;
      min-height: 100%;
      padding: var(--dash-gap);
      background: var(--dash-bg);
      color: var(--dash-fg);
    }
    .dashboard-grid {
      display: grid;
      gap: var(--dash-gap);
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-template-rows: auto auto auto auto auto;
      grid-template-areas:
        'tiles tiles tiles'
        'bars bars gauges'
        'timeline timeline timeline'
        'cards cards cards'
        'stats stats stats';
    }
    .dashboard-grid > * {
      min-width: 0;
      scroll-margin: var(--dash-gap);
    }
    .dashboard-grid :focus-visible {
      outline: 3px solid var(--dash-accent);
      outline-offset: 2px;
    }
    .area-tiles { grid-area: tiles; }
    .area-bars { grid-area: bars; }
    .area-gauges { grid-area: gauges; }
    .area-timeline { grid-area: timeline; }
    .area-cards { grid-area: cards; }
    .area-stats { grid-area: stats; }
    @media (max-width: 768px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
        grid-template-rows: none;
        grid-template-areas: 'tiles' 'bars' 'gauges' 'timeline' 'cards' 'stats';
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host, :host * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  `,
})
export class DashboardPageComponent implements OnInit {
  protected readonly telemetry = inject(TelemetryStore);
  protected readonly workout = inject(WorkoutStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly gaugeValues = computed<RadialGaugeValue[]>(() => [
    { label: 'Completed', percentage: this.workout.completedPercentage() },
    { label: 'Remaining', percentage: this.workout.remainingPercentage() },
  ]);

  ngOnInit(): void {
    this.telemetry.load();
    this.telemetry.startStream();
    this.destroyRef.onDestroy(() => this.telemetry.stopStream());
  }
}
