import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TrainerProfile } from '../../core/models/trainer-profile.model';
import { ViewState } from '../../shared/models/view-state.model';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { TrainerAvatarComponent } from '../trainer-avatar/trainer-avatar.component';

@Component({
  selector: 'app-trainer-header',
  imports: [TrainerAvatarComponent, IconComponent],
  templateUrl: './trainer-header.component.html',
  styleUrl: './trainer-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainerHeaderComponent {
  profile = input.required<TrainerProfile | null>();
  state = input<ViewState>('success');
  previousRequested = output<void>();
  nextRequested = output<void>();
}
