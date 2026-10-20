import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ViewState } from '../../../../shared/models/view-state.model';
import { TrainingRatio } from '../../data/training-ratio.model';

@Component({
  imports: [],
  selector: 'app-comparison-split-bars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './comparison-split-bars.component.scss',
  templateUrl: './comparison-split-bars.component.html',
})
export class ComparisonSplitBarsComponent {
  ratios = input.required<readonly TrainingRatio[]>();
  state = input<ViewState>('success');
  resetRequested = output<void>();
}
