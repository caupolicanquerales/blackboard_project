import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { WorkoutStep } from '../../../core/models/workout-step.model';

export type StepListStatus = 'loading' | 'empty' | 'error' | 'success';

@Component({
  selector: 'app-step-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'step-list', 'data-region': 'step-list' },
  template: `
    @switch (status()) {
      @case ('loading') {
        <p class="state loading" role="status" aria-live="polite">Loading steps…</p>
      }
      @case ('error') {
        <p class="state error" role="alert">Unable to load steps. Please try again.</p>
      }
      @default {
        @if (steps().length === 0 || status() === 'empty') {
          <p class="state empty" role="status">No steps available yet.</p>
        } @else {
          <ul class="list" aria-label="Workout steps">
            @for (step of steps(); track step.id) {
              <li
                class="card"
                tabindex="0"
                [class.selected]="step.id === selectedId()"
                [class.completed]="step.isCompleted"
                [attr.aria-current]="step.id === selectedId() ? 'true' : null"
                (click)="stepSelected.emit(step.id)"
                (keydown.enter)="onKey($event, step.id)"
                (keydown.space)="onKey($event, step.id)"
              >
                <span class="number">{{ step.stepNumber }}</span>
                <span class="title">{{ step.title }}</span>
                <button
                  type="button"
                  class="check"
                  tabindex="0"
                  [disabled]="step.isCompleted"
                  [attr.aria-label]="
                    step.isCompleted ? step.title + ' completed' : 'Mark ' + step.title + ' as complete'
                  "
                  (click)="onComplete($event, step.id)"
                  (keydown.enter)="$event.stopPropagation()"
                  (keydown.space)="$event.stopPropagation()"
                >
                  <span aria-hidden="true">{{ step.isCompleted ? '✓' : '○' }}</span>
                </button>
              </li>
            }
          </ul>
        }
      }
    }
  `,
  styles: `
    :host {
      display: block;
      grid-area: steps;
      min-width: 0;
      color: var(--text, #f5f5f5);
    }
    .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
    .card {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #2e2e2e;
      border-left: 4px solid #3a3a3a;
      background: #1c1c1c;
      cursor: pointer;
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .card:hover { background: #242424; }
    .card:focus-visible { outline: 3px solid #f5f5f5; outline-offset: 2px; }
    .card.selected { border-left-color: var(--accent, #ff5a1f); background: #262626; }
    .card.completed .title { color: #c4c4c4; text-decoration: line-through; }
    .number { font-weight: 800; font-style: italic; color: var(--accent, #ff5a1f); }
    .title { flex: 1; min-width: 0; overflow-wrap: anywhere; font-weight: 800; font-style: italic; }
    .check {
      min-width: 44px;
      min-height: 44px;
      border: 1px solid #3a3a3a;
      border-radius: 50%;
      background: transparent;
      color: var(--text, #f5f5f5);
      font-size: 1.1rem;
      cursor: pointer;
    }
    .check:focus-visible { outline: 3px solid #f5f5f5; outline-offset: 2px; }
    .check:disabled { background: var(--accent, #ff5a1f); color: #121212; border-color: transparent; cursor: default; }
    .state { margin: 0; padding: 16px; color: #c4c4c4; }
    .state.error { color: #ff8a80; }
    @media (prefers-reduced-motion: reduce) {
      .card { transition: none; }
    }
  `,
})
export class StepListComponent {
  readonly steps = input<WorkoutStep[]>([]);
  readonly selectedId = input<string | null>(null);
  readonly status = input<StepListStatus>('success');

  readonly stepSelected = output<string>();
  readonly stepCompleted = output<string>();

  onKey(event: Event, id: string): void {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    this.stepSelected.emit(id);
  }

  onComplete(event: Event, id: string): void {
    event.stopPropagation();
    this.stepCompleted.emit(id);
  }
}
