import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BiometricMetric } from '../../../../core/models/biometric-metric.model';
import { ViewState } from '../../../../shared/models/view-state.model';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

@Component({
  imports: [IconComponent],
  selector: 'app-biometric-tiles',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './biometric-tiles.component.scss',
  templateUrl: './biometric-tiles.component.html',
})
export class BiometricTilesComponent {
  metric = input.required<BiometricMetric | null>();
  state = input<ViewState>('success');
}
