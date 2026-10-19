import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TrainerProfile } from '../../core/models/trainer-profile.model';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-trainer-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './trainer-header.component.scss',
  templateUrl: './trainer-header.component.html',
})
export class TrainerHeaderComponent {
  readonly profile = input<TrainerProfile | null>(null);
}
