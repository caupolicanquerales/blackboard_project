import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';

import { ChevronStepperComponent } from '../../../shared/ui/chevron-stepper/chevron-stepper.component';
import { ExerciseStepCardsComponent } from '../../../shared/ui/exercise-step-cards/exercise-step-cards.component';
import { DashboardStore } from '../data/dashboard.store';
import { BiometricTilesComponent } from '../ui/biometric-tiles/biometric-tiles.component';
import { ComparisonBarsComponent } from '../ui/comparison-bars/comparison-bars.component';
import { RadialGaugesComponent } from '../ui/radial-gauges/radial-gauges.component';
import { StatisticsBarComponent } from '../ui/statistics-bar/statistics-bar.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    BiometricTilesComponent,
    ComparisonBarsComponent,
    RadialGaugesComponent,
    ChevronStepperComponent,
    ExerciseStepCardsComponent,
    StatisticsBarComponent,
  ],
  providers: [DashboardStore],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  protected readonly store = inject(DashboardStore);

  ngOnInit(): void {
    this.store.load();
    this.store.startLive();
  }

  ngOnDestroy(): void {
    this.store.stopLive();
  }
}
