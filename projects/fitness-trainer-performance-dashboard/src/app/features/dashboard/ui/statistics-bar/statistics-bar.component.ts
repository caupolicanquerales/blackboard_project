import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BiometricMetric } from '../../../../core/models/biometric-metric.model';
import { ViewState } from '../../../../shared/models/view-state.model';

@Component({
  imports: [],
  selector: 'app-statistics-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './statistics-bar.component.scss',
  templateUrl: './statistics-bar.component.html',
})
export class StatisticsBarComponent {
  metric = input.required<BiometricMetric | null>();
  state = input<ViewState>('success');

  percent = computed(() => {
    const load = this.metric()?.trainingLoad ?? 0;
    return Math.min(100, Math.max(0, Math.round(load)));
  });
}
