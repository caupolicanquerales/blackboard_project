import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ToastStore } from '../../core/state/toast.store';

@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-host.component.html',
  styleUrl: './toast-host.component.scss',
})
export class ToastHostComponent {
  private readonly store = inject(ToastStore);

  protected readonly toasts = this.store.toasts;
  protected readonly state = computed<'empty' | 'visible'>(() => (this.toasts().length ? 'visible' : 'empty'));

  protected close(id: string): void {
    this.store.dismiss(id);
  }
}
