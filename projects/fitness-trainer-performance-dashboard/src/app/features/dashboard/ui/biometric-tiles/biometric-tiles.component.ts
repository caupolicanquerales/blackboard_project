import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BiometricMetric } from '../../../../core/models/telemetry.model';

@Component({
  imports: [],
  selector: 'app-biometric-tiles',
  styleUrl: './biometric-tiles.component.scss',
  templateUrl: './biometric-tiles.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BiometricTilesComponent {
  readonly metric = input<BiometricMetric | null>(null);
}
