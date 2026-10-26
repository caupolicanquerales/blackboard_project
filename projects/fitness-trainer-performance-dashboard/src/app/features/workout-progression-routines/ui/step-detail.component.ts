import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { WorkoutStep } from '../../../core/models/workout-step.model';

@Component({
  selector: 'app-step-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'step-detail', 'data-region': 'step-detail' },
  template: `
    @if (step(); as s) {
      <section class="detail success" aria-labelledby="step-detail-title">
        <h3 id="step-detail-title" class="title">{{ s.title }}</h3>
        <p class="description">{{ s.description }}</p>
        <button
          type="button"
          class="complete"
          [disabled]="s.isCompleted"
          (click)="completeRequested.emit(s.id)"
        >
          {{ s.isCompleted ? 'Completed' : 'Mark as complete' }}
        </button>
      </section>
    } @else {
      <section class="detail empty" aria-labelledby="step-detail-title">
        <h3 id="step-detail-title" class="title">Step detail</h3>
        <p class="state" role="status">Select a step to see its details.</p>
      </section>
    }
  `,
  styles: `
    :host {
      display: block;
      grid-area: detail;
      min-width: 0;
      color: var(--text, #f5f5f5);
    }
    .detail {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
      padding: 24px;
      border-radius: 8px;
      border: 1px solid #2e2e2e;
      border-left: 4px solid var(--accent, #ff5a1f);
      background: #1c1c1c;
    }
    .title {
      margin: 0;
      font-size: clamp(1.5rem, 4vw, 2.25rem);
      line-height: 1.1;
      font-style: italic;
      font-weight: 800;
      text-transform: uppercase;
      overflow-wrap: anywhere;
    }
    .description { margin: 0; color: #c4c4c4; line-height: 1.5; overflow-wrap: anywhere; }
    .state { margin: 0; color: #c4c4c4; }
    .complete {
      align-self: flex-start;
      min-height: 44px;
      padding: 12px 28px;
      border: 0;
      border-radius: 4px;
      background: var(--accent, #ff5a1f);
      color: #121212;
      font-size: 1rem;
      font-weight: 800;
      font-style: italic;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      cursor: pointer;
      transition: filter 0.15s ease, transform 0.15s ease;
    }
    .complete:hover:not(:disabled) { filter: brightness(1.1); }
    .complete:focus-visible { outline: 3px solid #f5f5f5; outline-offset: 3px; }
    .complete:disabled { background: #3a3a3a; color: #d0d0d0; cursor: not-allowed; }
    @media (max-width: 768px) {
      .detail { padding: 16px; }
      .complete { align-self: stretch; }
    }
    @media (prefers-reduced-motion: reduce) {
      .complete { transition: none; }
    }
  `,
})
export class StepDetailComponent {
  readonly step = input<WorkoutStep | null>(null);
  readonly completeRequested = output<string>();
}
