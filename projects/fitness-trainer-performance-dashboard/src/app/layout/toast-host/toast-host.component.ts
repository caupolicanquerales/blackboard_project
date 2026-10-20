import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Notification } from '../../core/models/notification.model';

@Component({
  selector: 'app-toast-host',
  imports: [],
  templateUrl: './toast-host.component.html',
  styleUrl: './toast-host.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastHostComponent {
  toasts = input.required<readonly Notification[]>();
  dismissed = output<string>();
}
