import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Toast } from '../../core/models/toast.model';

@Component({
  selector: 'app-toast-overlay',
  imports: [],
  templateUrl: './toast-overlay.component.html',
  styleUrl: './toast-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastOverlayComponent {
  readonly toasts = input<Toast[]>([]);
  readonly dismissed = output<string>();

  dismiss(id: string): void {
    this.dismissed.emit(id);
  }
}
