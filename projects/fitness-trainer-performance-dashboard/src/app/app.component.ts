import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ToastStore } from './core/alerts/toast.store';
import { TrainerProfileStore } from './core/profile/trainer-profile.store';
import { ViewState } from './shared/models/view-state.model';
import { ToastHostComponent } from './layout/toast-host/toast-host.component';
import { TrainerHeaderComponent } from './layout/trainer-header/trainer-header.component';

const ROUTE_CYCLE = ['/dashboard', '/routines'] as const;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TrainerHeaderComponent, ToastHostComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly profileStore = inject(TrainerProfileStore);
  private readonly toastStore = inject(ToastStore);
  private readonly router = inject(Router);

  protected readonly profile = this.profileStore.profile;
  protected readonly toasts = this.toastStore.toasts;

  protected readonly headerState = computed<ViewState>(() => {
    if (this.profileStore.loading()) return 'loading';
    if (this.profileStore.error()) return 'error';
    return this.profileStore.profile() ? 'success' : 'empty';
  });

  constructor() {
    this.profileStore.load();
  }

  protected previous(): void {
    this.step(-1);
  }

  protected next(): void {
    this.step(1);
  }

  protected dismiss(id: string): void {
    this.toastStore.dismiss(id);
  }

  private step(delta: number): void {
    const current = ROUTE_CYCLE.findIndex((r) => this.router.url.startsWith(r));
    const base = current === -1 ? 0 : current;
    const target = ROUTE_CYCLE[(base + delta + ROUTE_CYCLE.length) % ROUTE_CYCLE.length];
    void this.router.navigateByUrl(target);
  }
}
