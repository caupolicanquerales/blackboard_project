import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconName } from '../../models/icon-name.model';

@Component({
  imports: [],
  selector: 'app-icon',
  styleUrl: './icon.component.scss',
  templateUrl: './icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  name = input.required<IconName>();
  size = input<number>(24);
}
