import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { WorkoutStep } from '../../../core/models/workout-step.model';
import { TelemetryStatus } from '../data/telemetry.store';

@Component({
  selector: 'app-exercise-step-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'exercise-step-cards', 'data-region': 'exercise-cards' },
  template: `
    @switch (status()) {
      @case ('loading') {
        <p class="state" role="status">Loading exercise steps…</p>
      }
      @case ('error') {
        <p class="state" role="alert">Unable to load exercise steps.</p>
      }
      @case ('empty') {
        <p class="state" role="status">No exercise steps available.</p>
      }
      @default {
        <ul class="cards">
          @for (step of steps(); track step.id) {
            <li class="card" tabindex="0" [class.completed]="step.isCompleted">
              <h3 class="card-title">STEP {{ pad(step.stepNumber) }}</h3>
              <p class="card-subtitle">{{ step.title }}</p>
              <p class="card-text">{{ step.description }}</p>
              <label class="check">
                <input
                  type="checkbox"
                  [checked]="step.isCompleted"
                  (change)="stepCompleted.emit(step.id)"
                />
                <span>Mark as complete</span>
              </label>
            </li>
          }
        </ul>
      }
    }
  `,
  styles: `
    :host {
      --accent: #ff5a1f;
      --surface: #1c1c1c;
      --text: #f5f5f5;
      --muted: #b8b8b8;
      display: block;
      min-width: 0;
      color: var(--text);
    }
    .cards {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
      align-items: stretch;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .card {
      position: relative;
      min-width: 0;
      padding: 16px 16px 16px 20px;
      background: var(--surface);
      border: 1px solid #333;
      border-left: 4px solid #444;
      border-radius: 8px;
      overflow-wrap: anywhere;
      transition: border-color 0.2s ease, transform 0.2s ease;
    }
    .card:hover {
      border-color: var(--accent);
    }
    .card:focus-visible,
    .check input:focus-visible {
      outline: 3px solid var(--accent);
      outline-offset: 3px;
    }
    .card.completed {
      border-left-color: var(--accent);
    }
    .card.completed .card-title::after {
      content: ' ✓';
      color: var(--accent);
    }
    .card-title {
      margin: 0 0 4px;
      font-style: italic;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: var(--accent);
    }
    .card-subtitle {
      margin: 0 0 8px;
      font-style: italic;
      font-weight: 700;
      font-size: 1.125rem;
    }
    .card-text {
      margin: 0 0 12px;
      color: var(--muted);
      line-height: 1.5;
    }
    .check {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
    .check input {
      width: 20px;
      height: 20px;
      accent-color: var(--accent);
    }
    .state {
      margin: 0;
      padding: 16px;
      background: var(--surface);
      border-radius: 8px;
      color: var(--muted);
    }
    .state[role='alert'] {
      color: #ff8a65;
      border: 1px solid #ff8a65;
    }
    @media (prefers-reduced-motion: reduce) {
      .card {
        transition: none;
      }
    }
    @media (max-width: 768px) {
      .cards {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class ExerciseStepCardsComponent {
  readonly steps = input<WorkoutStep[]>([]);
  readonly status = input<TelemetryStatus>('success');
  readonly stepCompleted = output<string>();

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }
}
