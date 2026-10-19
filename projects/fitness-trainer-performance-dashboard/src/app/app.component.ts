import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastStore } from './core/notifications/toast.store';
import { TrainerProfileStore } from './core/auth/trainer-profile.store';
import { TrainerHeaderComponent } from './layout/trainer-header/trainer-header.component';
import { ToastOverlayComponent } from './layout/toast-overlay/toast-overlay.component';

@Component({
  imports: [RouterOutlet, TrainerHeaderComponent, ToastOverlayComponent],
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.component.scss',
  templateUrl: './app.component.html',
})
export class AppComponent {
  private readonly toastStore = inject(ToastStore);
  private readonly profileStore = inject(TrainerProfileStore);

  protected readonly profile = this.profileStore.profile;
  protected readonly toasts = this.toastStore.toasts;

  protected dismiss(id: string): void {
    this.toastStore.dismiss(id);
  }
}
