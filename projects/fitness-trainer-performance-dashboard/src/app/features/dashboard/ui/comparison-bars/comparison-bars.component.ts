import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TrainingRatio } from '../../data/dashboard.model';

@Component({
  selector: 'app-comparison-bars',
  templateUrl: './comparison-bars.component.html',
  styleUrls: ['./comparison-bars.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparisonBarsComponent {
  readonly ratios = input<TrainingRatio[]>([]);
}
