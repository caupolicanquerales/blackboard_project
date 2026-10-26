import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TrainerProfileStore } from '../../core/state/trainer-profile.store';
import { IconComponent } from '../../shared/ui/icon.component';

const ROUTES = ['/dashboard', '/routines'] as const;

@Component({
  selector: 'app-trainer-header',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trainer-header.component.html',
  styleUrl: './trainer-header.component.scss',
})
export class TrainerHeaderComponent {
  private readonly store = inject(TrainerProfileStore);
  private readonly router = inject(Router);

  protected readonly profile = this.store.profile;
  protected readonly status = this.store.status;
  protected readonly headline = 'PERSONAL TRAINER';
  protected readonly isLoading = computed(() => this.status() === 'loading');

  private currentIndex(): number {
    const idx = ROUTES.findIndex((r) => this.router.url.startsWith(r));
    return idx < 0 ? 0 : idx;
  }

  protected goPrevious(): void {
    const i = this.currentIndex();
    void this.router.navigateByUrl(ROUTES[(i - 1 + ROUTES.length) % ROUTES.length]);
  }

  protected goNext(): void {
    const i = this.currentIndex();
    void this.router.navigateByUrl(ROUTES[(i + 1) % ROUTES.length]);
  }
}
