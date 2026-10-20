import { Component, computed, input, signal } from '@angular/core';
import { ViewState } from '../../shared/models/view-state.model';

@Component({
  imports: [],
  selector: 'app-trainer-avatar',
  styleUrl: './trainer-avatar.component.scss',
  templateUrl: './trainer-avatar.component.html',
})
export class TrainerAvatarComponent {
  avatar = input.required<string | null>();
  displayName = input<string>('');
  state = input<ViewState>('success');

  protected readonly imageFailed = signal(false);
  protected readonly initial = computed(() => this.displayName().trim().charAt(0).toUpperCase());
  protected readonly view = computed<'loading' | 'image' | 'placeholder' | 'error'>(() => {
    const state = this.state();
    if (state === 'loading') return 'loading';
    if (state === 'error' || this.imageFailed()) return 'error';
    if (state === 'empty' || !this.avatar()) return 'placeholder';
    return 'image';
  });

  protected onImageError(): void {
    this.imageFailed.set(true);
  }
}
