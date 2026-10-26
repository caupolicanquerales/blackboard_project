import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PhaseProgress } from '../../../core/models/phase-progress.model';

@Component({
  selector: 'app-phase-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'phase-stepper', 'data-region': 'phase-stepper' },
  template: `
    <ol class="steps" aria-label="Workout progression phases">
      @for (phase of visiblePhases(); track phase.id; let i = $index) {
        <li
          class="step"
          [class.pending]="phase.status === 'PENDING'"
          [class.in-progress]="phase.status === 'IN_PROGRESS'"
          [class.completed]="phase.status === 'COMPLETED'"
          [attr.aria-current]="phase.status === 'IN_PROGRESS' ? 'step' : null"
        >
          <span class="num">PHASE {{ i + 1 }}</span>
          <span class="name">{{ phase.phaseName }}</span>
          <span class="status">
            {{ phase.status === 'IN_PROGRESS' ? phase.completionPercentage + '%' : phase.status === 'COMPLETED' ? 'completed' : 'pending' }}
          </span>
        </li>
      } @empty {
        <li class="state" role="status">No phases available.</li>
      }
    </ol>
    <button
      type="button"
      class="advance"
      aria-label="Advance to next phase"
      [disabled]="!canAdvance()"
      (click)="advanceRequested.emit()"
    >
      Next phase &#9656;
    </button>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
      grid-area: stepper;
      min-width: 0;
      color: var(--text, #f5f5f5);
      --accent: #ff5a1f;
      --surface: #1c1c1c;
    }
    .steps {
      align-items: center;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 4px;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .step {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      padding: 14px 28px 14px 24px;
      background: #1c1c1c;
      color: #c4c4c4;
      clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%, 18px 50%);
      font-style: italic;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .step:first-child { clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%); }
    .num { font-size: 0.7rem; letter-spacing: 0.12em; }
    .name { overflow-wrap: anywhere; }
    .status { font-size: 0.75rem; font-weight: 600; }
    .completed { background: #3a2216; color: #f5f5f5; }
    .in-progress { background: #ff5a1f; color: #121212; }
    .state { padding: 16px; color: #c4c4c4; }
    .advance {
      align-self: flex-end;
      padding: 10px 20px;
      border: 0;
      border-radius: 4px;
      background: var(--accent);
      color: #121212;
      font-weight: 800;
      font-style: italic;
      transition: filter 150ms ease;
      text-transform: uppercase;
      cursor: pointer;
    }
    .advance:focus-visible { outline: 2px solid #f5f5f5; outline-offset: 2px; }
    .advance:hover:not(:disabled) { filter: brightness(1.1); }
    .advance:disabled { opacity: 0.5; cursor: not-allowed; }
    @media (prefers-reduced-motion: reduce) {
      .advance { transition: none; }
    }
    @media (max-width: 768px) {
      .steps { grid-template-columns: 1fr; }
      .step, .step:first-child { clip-path: none; border-radius: 8px; }
      .advance { align-self: stretch; }
    }
  `,
})
export class PhaseStepperComponent {
  readonly phases = input<PhaseProgress[]>([]);
  readonly advanceRequested = output<void>();

  protected readonly visiblePhases = computed(() => this.phases().slice(0, 4));
  protected readonly canAdvance = computed(() =>
    this.visiblePhases().some((p) => p.status !== 'COMPLETED'),
  );
}
